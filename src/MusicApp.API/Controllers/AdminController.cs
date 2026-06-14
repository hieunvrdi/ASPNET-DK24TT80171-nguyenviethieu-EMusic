using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using BCrypt.Net;
using MusicApp.Core.DTOs.Admin;
using MusicApp.Core.DTOs.Albums;
using MusicApp.Core.DTOs.Artists;
using MusicApp.Core.DTOs.Common;
using MusicApp.Core.DTOs.Genres;
using MusicApp.Core.DTOs.Songs;
using MusicApp.Core.Entities;
using MusicApp.Core.Enums;
using MusicApp.Core.Interfaces.Repositories;
using MusicApp.Core.Interfaces.Services;
using MusicApp.Infrastructure.Data;

namespace MusicApp.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase
{
    private readonly ISongRepository _songRepo;
    private readonly IUserRepository _userRepo;
    private readonly IArtistRepository _artistRepo;
    private readonly IFileService _fileService;
    private readonly IMapper _mapper;
    private readonly AppDbContext _context;

    public AdminController(
        ISongRepository songRepo,
        IUserRepository userRepo,
        IArtistRepository artistRepo,
        IFileService fileService,
        IMapper mapper,
        AppDbContext context)
    {
        _songRepo = songRepo;
        _userRepo = userRepo;
        _artistRepo = artistRepo;
        _fileService = fileService;
        _mapper = mapper;
        _context = context;
    }

    // ─── Songs pending ────────────────────────────────────────────────────────

    // GET /api/admin/songs/pending
    [HttpGet("songs/pending")]
    public async Task<ActionResult<ApiResponse<List<SongDto>>>> GetPending()
    {
        var songs = await _songRepo.GetPendingAsync();
        return Ok(ApiResponse<List<SongDto>>.Ok(_mapper.Map<List<SongDto>>(songs)));
    }

    // PATCH /api/admin/songs/{id}/approve
    [HttpPatch("songs/{id}/approve")]
    public async Task<ActionResult<ApiResponse<SongDto>>> Approve(int id)
    {
        var song = await _songRepo.GetByIdAsync(id);
        if (song == null)
            return NotFound(ApiResponse<SongDto>.Fail("Song not found."));

        if (song.Status != SongStatus.Pending)
            return BadRequest(ApiResponse<SongDto>.Fail($"Song is already {song.Status}."));

        song.Status = SongStatus.Approved;
        _songRepo.Update(song);
        await _songRepo.SaveChangesAsync();

        return Ok(ApiResponse<SongDto>.Ok(_mapper.Map<SongDto>(song)));
    }

    // PATCH /api/admin/songs/{id}/reject
    [HttpPatch("songs/{id}/reject")]
    public async Task<ActionResult<ApiResponse<SongDto>>> Reject(int id)
    {
        var song = await _songRepo.GetByIdAsync(id);
        if (song == null)
            return NotFound(ApiResponse<SongDto>.Fail("Song not found."));

        if (song.Status != SongStatus.Pending)
            return BadRequest(ApiResponse<SongDto>.Fail($"Song is already {song.Status}."));

        song.Status = SongStatus.Rejected;
        _songRepo.Update(song);
        await _songRepo.SaveChangesAsync();

        return Ok(ApiResponse<SongDto>.Ok(_mapper.Map<SongDto>(song)));
    }

    // ─── Songs management ─────────────────────────────────────────────────────

    // GET /api/admin/songs?page=1&pageSize=20&search=&status=
    [HttpGet("songs")]
    public async Task<ActionResult<PagedResult<SongDto>>> GetAllSongs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null)
    {
        var result = await _songRepo.GetAllForAdminAsync(page, pageSize, search, status);
        return Ok(new PagedResult<SongDto>
        {
            Data = _mapper.Map<List<SongDto>>(result.Data),
            Total = result.Total,
            Page = result.Page,
            PageSize = result.PageSize
        });
    }

    // PUT /api/admin/songs/{id}
    [HttpPut("songs/{id}")]
    public async Task<ActionResult<ApiResponse<SongDto>>> UpdateSong(int id, [FromForm] UpdateSongDto dto)
    {
        var song = await _songRepo.GetByIdAsync(id);
        if (song == null)
            return NotFound(ApiResponse<SongDto>.Fail("Song not found."));

        var primarySongArtistId = dto.ArtistIds.FirstOrDefault();

        song.Title       = dto.Title;
        song.ArtistId    = primarySongArtistId != 0 ? primarySongArtistId : song.ArtistId;
        song.AlbumId     = dto.AlbumId;
        song.Description = dto.Description;
        song.Lyrics      = dto.Lyrics;

        if (Enum.TryParse<SongStatus>(dto.Status, true, out var newStatus))
            song.Status = newStatus;

        if (dto.CoverFile != null)
        {
            if (!string.IsNullOrEmpty(song.CoverUrl))
                await _fileService.DeleteFileAsync(song.CoverUrl);
            song.CoverUrl = await _fileService.SaveImageAsync(dto.CoverFile, "songs");
        }

        _songRepo.Update(song);
        await _songRepo.SaveChangesAsync();

        // Replace genres
        var existingGenres = await _context.SongGenres
            .Where(sg => sg.SongId == id).ToListAsync();
        _context.SongGenres.RemoveRange(existingGenres);
        foreach (var genreId in dto.GenreIds.Distinct())
            _context.SongGenres.Add(new SongGenre { SongId = id, GenreId = genreId });
        await _context.SaveChangesAsync();

        // Replace co-artists
        if (dto.ArtistIds.Any())
        {
            var existingSongArtists = await _context.SongArtists
                .Where(sa => sa.SongId == id).ToListAsync();
            _context.SongArtists.RemoveRange(existingSongArtists);
            int order = 0;
            foreach (var artistId in dto.ArtistIds.Distinct())
                _context.SongArtists.Add(new SongArtist { SongId = id, ArtistId = artistId, Order = order++ });
            await _context.SaveChangesAsync();
        }

        // Re-fetch with navigations for mapping
        var updated = await _songRepo.GetByIdAsync(id);
        return Ok(ApiResponse<SongDto>.Ok(_mapper.Map<SongDto>(updated!)));
    }

    // DELETE /api/admin/songs/{id}
    [HttpDelete("songs/{id}")]
    public async Task<IActionResult> DeleteSong(int id)
    {
        var song = await _songRepo.GetByIdAsync(id);
        if (song == null)
            return NotFound(ApiResponse<object>.Fail("Song not found."));

        await _fileService.DeleteFileAsync(song.FilePath);
        if (!string.IsNullOrEmpty(song.CoverUrl))
            await _fileService.DeleteFileAsync(song.CoverUrl);
        _songRepo.Delete(song);
        await _songRepo.SaveChangesAsync();

        return NoContent();
    }

    // ─── Artists management ───────────────────────────────────────────────────

    // GET /api/admin/artists
    [HttpGet("artists")]
    public async Task<ActionResult<ApiResponse<List<AdminArtistDto>>>> GetAllArtists()
    {
        var artists = await _context.Artists
            .Include(a => a.Songs)
            .OrderBy(a => a.Name)
            .ToListAsync();

        var dtos = artists.Select(a => new AdminArtistDto
        {
            Id        = a.Id,
            Name      = a.Name,
            Bio       = a.Bio,
            AvatarUrl = a.AvatarUrl,
            SongCount = a.Songs.Count
        }).ToList();

        return Ok(ApiResponse<List<AdminArtistDto>>.Ok(dtos));
    }

    // PUT /api/admin/artists/{id}
    [HttpPut("artists/{id}")]
    public async Task<ActionResult<ApiResponse<AdminArtistDto>>> UpdateArtist(
        int id, [FromForm] UpdateArtistDto dto)
    {
        var artist = await _context.Artists
            .Include(a => a.Songs)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (artist == null)
            return NotFound(ApiResponse<AdminArtistDto>.Fail("Artist not found."));

        artist.Name = dto.Name;
        artist.Bio  = dto.Bio;

        if (dto.AvatarFile != null)
        {
            if (!string.IsNullOrEmpty(artist.AvatarUrl))
                await _fileService.DeleteFileAsync(artist.AvatarUrl);

            artist.AvatarUrl = await _fileService.SaveImageAsync(dto.AvatarFile, "artists");
        }

        _context.Artists.Update(artist);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<AdminArtistDto>.Ok(new AdminArtistDto
        {
            Id        = artist.Id,
            Name      = artist.Name,
            Bio       = artist.Bio,
            AvatarUrl = artist.AvatarUrl,
            SongCount = artist.Songs.Count
        }));
    }

    // DELETE /api/admin/artists/{id}
    [HttpDelete("artists/{id}")]
    public async Task<IActionResult> DeleteArtist(int id)
    {
        var artist = await _context.Artists
            .Include(a => a.Songs)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (artist == null)
            return NotFound(ApiResponse<object>.Fail("Artist not found."));

        if (artist.Songs.Any())
            return BadRequest(ApiResponse<object>.Fail(
                $"Không thể xóa nhạc sĩ còn {artist.Songs.Count} bài hát. Hãy xóa bài hát trước."));

        if (!string.IsNullOrEmpty(artist.AvatarUrl))
            await _fileService.DeleteFileAsync(artist.AvatarUrl);

        _context.Artists.Remove(artist);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // ─── Albums management ────────────────────────────────────────────────────

    // POST /api/admin/albums
    [HttpPost("albums")]
    public async Task<ActionResult<ApiResponse<AdminAlbumDto>>> CreateAlbum([FromForm] UpdateAlbumDto dto)
    {
        string? coverUrl = null;
        if (dto.CoverFile != null)
            coverUrl = await _fileService.SaveImageAsync(dto.CoverFile, "albums");

        // Determine primary artist: prefer ArtistIds[0], fall back to ArtistId
        var albumArtistIds = dto.ArtistIds.Any() ? dto.ArtistIds : (dto.ArtistId != 0 ? new List<int> { dto.ArtistId } : new List<int>());
        var primaryAlbumArtistId = albumArtistIds.FirstOrDefault() != 0 ? albumArtistIds.FirstOrDefault() : dto.ArtistId;

        var album = new Core.Entities.Album
        {
            Title       = dto.Title,
            ArtistId    = primaryAlbumArtistId,
            ReleaseYear = dto.ReleaseYear,
            CoverUrl    = coverUrl
        };

        _context.Albums.Add(album);
        await _context.SaveChangesAsync();

        // Assign co-artists
        if (albumArtistIds.Any())
        {
            int order = 0;
            foreach (var artistId in albumArtistIds.Distinct())
                _context.AlbumArtists.Add(new AlbumArtist { AlbumId = album.Id, ArtistId = artistId, Order = order++ });
            await _context.SaveChangesAsync();
        }

        var created = await _context.Albums
            .Include(a => a.Artist)
            .Include(a => a.AlbumArtists).ThenInclude(aa => aa.Artist)
            .Include(a => a.Songs)
            .FirstAsync(a => a.Id == album.Id);

        return Ok(ApiResponse<AdminAlbumDto>.Ok(new AdminAlbumDto
        {
            Id          = created.Id,
            Title       = created.Title,
            ArtistId    = created.ArtistId,
            ArtistName  = created.Artist.Name,
            CoverUrl    = created.CoverUrl,
            ReleaseYear = created.ReleaseYear,
            SongCount   = 0,
            Artists     = created.AlbumArtists.OrderBy(aa => aa.Order)
                            .Select(aa => new MusicApp.Core.DTOs.Artists.ArtistBriefDto
                            {
                                Id        = aa.Artist.Id,
                                Name      = aa.Artist.Name,
                                AvatarUrl = aa.Artist.AvatarUrl
                            }).ToList()
        }));
    }

    // GET /api/admin/albums?search=
    [HttpGet("albums")]
    public async Task<ActionResult<ApiResponse<List<AdminAlbumDto>>>> GetAllAlbums(
        [FromQuery] string? search = null)
    {
        var query = _context.Albums
            .Include(a => a.Artist)
            .Include(a => a.AlbumArtists).ThenInclude(aa => aa.Artist)
            .Include(a => a.Songs)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            query = query.Where(a =>
                a.Title.ToLower().Contains(lower) ||
                a.Artist.Name.ToLower().Contains(lower));
        }

        var albums = await query.OrderBy(a => a.Artist.Name).ThenBy(a => a.Title).ToListAsync();

        var dtos = albums.Select(a => new AdminAlbumDto
        {
            Id          = a.Id,
            Title       = a.Title,
            ArtistId    = a.ArtistId,
            ArtistName  = a.Artist.Name,
            CoverUrl    = a.CoverUrl,
            ReleaseYear = a.ReleaseYear,
            SongCount   = a.Songs.Count,
            Artists     = a.AlbumArtists.OrderBy(aa => aa.Order)
                            .Select(aa => new MusicApp.Core.DTOs.Artists.ArtistBriefDto
                            {
                                Id        = aa.Artist.Id,
                                Name      = aa.Artist.Name,
                                AvatarUrl = aa.Artist.AvatarUrl
                            }).ToList()
        }).ToList();

        return Ok(ApiResponse<List<AdminAlbumDto>>.Ok(dtos));
    }

    // PUT /api/admin/albums/{id}
    [HttpPut("albums/{id}")]
    public async Task<ActionResult<ApiResponse<AdminAlbumDto>>> UpdateAlbum(
        int id, [FromForm] UpdateAlbumDto dto)
    {
        var album = await _context.Albums
            .Include(a => a.Artist)
            .Include(a => a.AlbumArtists).ThenInclude(aa => aa.Artist)
            .Include(a => a.Songs)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (album == null)
            return NotFound(ApiResponse<AdminAlbumDto>.Fail("Album not found."));

        // Determine primary artist: prefer ArtistIds[0], fall back to ArtistId
        var updateAlbumArtistIds = dto.ArtistIds.Any() ? dto.ArtistIds : (dto.ArtistId != 0 ? new List<int> { dto.ArtistId } : new List<int>());
        var primaryUpdateAlbumArtistId = updateAlbumArtistIds.FirstOrDefault() != 0 ? updateAlbumArtistIds.FirstOrDefault() : dto.ArtistId;

        album.Title       = dto.Title;
        album.ArtistId    = primaryUpdateAlbumArtistId != 0 ? primaryUpdateAlbumArtistId : album.ArtistId;
        album.ReleaseYear = dto.ReleaseYear;

        if (dto.CoverFile != null)
        {
            if (!string.IsNullOrEmpty(album.CoverUrl))
                await _fileService.DeleteFileAsync(album.CoverUrl);
            album.CoverUrl = await _fileService.SaveImageAsync(dto.CoverFile, "albums");
        }

        _context.Albums.Update(album);
        await _context.SaveChangesAsync();

        // Replace co-artists
        if (updateAlbumArtistIds.Any())
        {
            var existingAlbumArtists = await _context.AlbumArtists
                .Where(aa => aa.AlbumId == id).ToListAsync();
            _context.AlbumArtists.RemoveRange(existingAlbumArtists);
            int order = 0;
            foreach (var artistId in updateAlbumArtistIds.Distinct())
                _context.AlbumArtists.Add(new AlbumArtist { AlbumId = id, ArtistId = artistId, Order = order++ });
            await _context.SaveChangesAsync();
        }

        // Re-fetch artist name after potential artist change
        var updated = await _context.Albums
            .Include(a => a.Artist)
            .Include(a => a.AlbumArtists).ThenInclude(aa => aa.Artist)
            .Include(a => a.Songs)
            .FirstAsync(a => a.Id == id);

        return Ok(ApiResponse<AdminAlbumDto>.Ok(new AdminAlbumDto
        {
            Id          = updated.Id,
            Title       = updated.Title,
            ArtistId    = updated.ArtistId,
            ArtistName  = updated.Artist.Name,
            CoverUrl    = updated.CoverUrl,
            ReleaseYear = updated.ReleaseYear,
            SongCount   = updated.Songs.Count,
            Artists     = updated.AlbumArtists.OrderBy(aa => aa.Order)
                            .Select(aa => new MusicApp.Core.DTOs.Artists.ArtistBriefDto
                            {
                                Id        = aa.Artist.Id,
                                Name      = aa.Artist.Name,
                                AvatarUrl = aa.Artist.AvatarUrl
                            }).ToList()
        }));
    }

    // DELETE /api/admin/albums/{id}
    [HttpDelete("albums/{id}")]
    public async Task<IActionResult> DeleteAlbum(int id)
    {
        var album = await _context.Albums
            .Include(a => a.Songs)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (album == null)
            return NotFound(ApiResponse<object>.Fail("Album not found."));

        if (album.Songs.Any())
            return BadRequest(ApiResponse<object>.Fail(
                $"Không thể xóa album còn {album.Songs.Count} bài hát. Hãy chuyển hoặc xóa bài hát trước."));

        if (!string.IsNullOrEmpty(album.CoverUrl))
            await _fileService.DeleteFileAsync(album.CoverUrl);

        _context.Albums.Remove(album);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // ─── Users ────────────────────────────────────────────────────────────────

    // GET /api/admin/users
    [HttpGet("users")]
    public async Task<ActionResult<ApiResponse<List<AdminUserDto>>>> GetUsers()
    {
        var users = await _context.Users
            .Include(u => u.UploadedSongs)
            .OrderBy(u => u.CreatedAt)
            .ToListAsync();

        return Ok(ApiResponse<List<AdminUserDto>>.Ok(_mapper.Map<List<AdminUserDto>>(users)));
    }

    // POST /api/admin/users — tạo tài khoản mới
    [HttpPost("users")]
    public async Task<ActionResult<ApiResponse<AdminUserDto>>> CreateUser([FromBody] CreateAdminUserDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.UserName))
            return BadRequest(ApiResponse<AdminUserDto>.Fail("Tên người dùng không được để trống."));
        if (string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest(ApiResponse<AdminUserDto>.Fail("Email không được để trống."));
        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6)
            return BadRequest(ApiResponse<AdminUserDto>.Fail("Mật khẩu phải có ít nhất 6 ký tự."));

        if (await _userRepo.UsernameExistsAsync(dto.UserName))
            return BadRequest(ApiResponse<AdminUserDto>.Fail("Tên người dùng đã tồn tại."));
        if (await _userRepo.EmailExistsAsync(dto.Email))
            return BadRequest(ApiResponse<AdminUserDto>.Fail("Email đã được sử dụng."));

        var validRoles = new[] { "User", "UserPro", "Admin" };
        var role = validRoles.Contains(dto.Role) ? dto.Role : "User";

        var user = new User
        {
            UserName     = dto.UserName.Trim(),
            Email        = dto.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role         = role,
            CreatedAt    = DateTime.UtcNow,
        };

        await _userRepo.AddAsync(user);
        await _userRepo.SaveChangesAsync();

        return Ok(ApiResponse<AdminUserDto>.Ok(new AdminUserDto
        {
            Id        = user.Id,
            UserName  = user.UserName,
            Email     = user.Email,
            Role      = user.Role,
            CreatedAt = user.CreatedAt,
            SongCount = 0,
        }));
    }

    // PUT /api/admin/users/{id} — chỉnh sửa tài khoản
    [HttpPut("users/{id}")]
    public async Task<ActionResult<ApiResponse<AdminUserDto>>> UpdateUser(int id, [FromBody] UpdateAdminUserDto dto)
    {
        var user = await _context.Users
            .Include(u => u.UploadedSongs)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            return NotFound(ApiResponse<AdminUserDto>.Fail("Người dùng không tồn tại."));

        if (string.IsNullOrWhiteSpace(dto.UserName))
            return BadRequest(ApiResponse<AdminUserDto>.Fail("Tên người dùng không được để trống."));
        if (string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest(ApiResponse<AdminUserDto>.Fail("Email không được để trống."));

        // Check uniqueness (excluding self)
        var dupName = await _context.Users
            .AnyAsync(u => u.UserName == dto.UserName.Trim() && u.Id != id);
        if (dupName)
            return BadRequest(ApiResponse<AdminUserDto>.Fail("Tên người dùng đã được sử dụng."));

        var dupEmail = await _context.Users
            .AnyAsync(u => u.Email == dto.Email.Trim().ToLower() && u.Id != id);
        if (dupEmail)
            return BadRequest(ApiResponse<AdminUserDto>.Fail("Email đã được sử dụng."));

        var validRoles = new[] { "User", "UserPro", "Admin" };
        user.UserName = dto.UserName.Trim();
        user.Email    = dto.Email.Trim().ToLower();
        user.Role     = validRoles.Contains(dto.Role) ? dto.Role : user.Role;

        if (!string.IsNullOrWhiteSpace(dto.NewPassword))
        {
            if (dto.NewPassword.Length < 6)
                return BadRequest(ApiResponse<AdminUserDto>.Fail("Mật khẩu mới phải có ít nhất 6 ký tự."));
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        }

        _context.Users.Update(user);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<AdminUserDto>.Ok(new AdminUserDto
        {
            Id        = user.Id,
            UserName  = user.UserName,
            Email     = user.Email,
            Role      = user.Role,
            CreatedAt = user.CreatedAt,
            SongCount = user.UploadedSongs.Count,
        }));
    }

    // DELETE /api/admin/users/{id} — xóa tài khoản
    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        // Prevent self-deletion
        var currentAdminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (id == currentAdminId)
            return BadRequest(ApiResponse<object>.Fail("Không thể xóa tài khoản của chính mình."));

        var user = await _context.Users
            .Include(u => u.UploadedSongs)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            return NotFound(ApiResponse<object>.Fail("Người dùng không tồn tại."));

        if (user.UploadedSongs.Any())
            return BadRequest(ApiResponse<object>.Fail(
                $"Người dùng còn {user.UploadedSongs.Count} bài hát. Hãy xóa bài hát trước."));

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // ─── Genres management ───────────────────────────────────────────────────

    // GET /api/admin/genres
    [HttpGet("genres")]
    public async Task<ActionResult<ApiResponse<List<GenreDto>>>> GetAllGenres()
    {
        var genres = await _context.Genres
            .Include(g => g.SongGenres)
            .OrderBy(g => g.Name)
            .ToListAsync();
        return Ok(ApiResponse<List<GenreDto>>.Ok(_mapper.Map<List<GenreDto>>(genres)));
    }

    // POST /api/admin/genres
    [HttpPost("genres")]
    public async Task<ActionResult<ApiResponse<GenreDto>>> CreateGenre([FromBody] CreateGenreDto dto)
    {
        var genre = new Genre { Name = dto.Name, Slug = dto.Slug };
        _context.Genres.Add(genre);
        await _context.SaveChangesAsync();
        var created = await _context.Genres.Include(g => g.SongGenres).FirstAsync(g => g.Id == genre.Id);
        return Ok(ApiResponse<GenreDto>.Ok(_mapper.Map<GenreDto>(created)));
    }

    // PUT /api/admin/genres/{id}
    [HttpPut("genres/{id}")]
    public async Task<ActionResult<ApiResponse<GenreDto>>> UpdateGenre(int id, [FromBody] CreateGenreDto dto)
    {
        var genre = await _context.Genres.Include(g => g.SongGenres).FirstOrDefaultAsync(g => g.Id == id);
        if (genre == null)
            return NotFound(ApiResponse<GenreDto>.Fail("Genre not found."));
        genre.Name = dto.Name;
        genre.Slug = dto.Slug;
        _context.Genres.Update(genre);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<GenreDto>.Ok(_mapper.Map<GenreDto>(genre)));
    }

    // DELETE /api/admin/genres/{id}
    [HttpDelete("genres/{id}")]
    public async Task<IActionResult> DeleteGenre(int id)
    {
        var genre = await _context.Genres.Include(g => g.SongGenres).FirstOrDefaultAsync(g => g.Id == id);
        if (genre == null)
            return NotFound(ApiResponse<object>.Fail("Genre not found."));
        if (genre.SongGenres.Any())
            return BadRequest(ApiResponse<object>.Fail(
                $"Không thể xóa thể loại đang được sử dụng bởi {genre.SongGenres.Count} bài hát."));
        _context.Genres.Remove(genre);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // ─── Stats ────────────────────────────────────────────────────────────────

    // GET /api/admin/stats
    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<StatsDto>>> GetStats()
    {
        var stats = new StatsDto
        {
            TotalUsers    = await _context.Users.CountAsync(),
            TotalSongs    = await _context.Songs.CountAsync(),
            TotalApproved = await _context.Songs.CountAsync(s => s.Status == SongStatus.Approved),
            TotalPending  = await _context.Songs.CountAsync(s => s.Status == SongStatus.Pending),
            TotalPlays    = await _context.Songs.SumAsync(s => (int?)s.PlayCount) ?? 0,
            TotalArtists  = await _context.Artists.CountAsync(),
            TotalAlbums   = await _context.Albums.CountAsync(),
        };

        return Ok(ApiResponse<StatsDto>.Ok(stats));
    }
}
