using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MusicApp.Core.DTOs.Common;
using MusicApp.Core.DTOs.Songs;
using MusicApp.Core.Entities;
using MusicApp.Core.Enums;
using MusicApp.Core.Interfaces.Repositories;
using MusicApp.Core.Interfaces.Services;
using MusicApp.Infrastructure.Data;

namespace MusicApp.API.Controllers;

[ApiController]
[Route("api/songs")]
public class SongsController : ControllerBase
{
    private readonly ISongRepository _songRepo;
    private readonly IPlayHistoryRepository _playHistoryRepo;
    private readonly IFileService _fileService;
    private readonly IMapper _mapper;
    private readonly ILogger<SongsController> _logger;
    private readonly AppDbContext _context;

    public SongsController(
        ISongRepository songRepo,
        IPlayHistoryRepository playHistoryRepo,
        IFileService fileService,
        IMapper mapper,
        ILogger<SongsController> logger,
        AppDbContext context)
    {
        _songRepo = songRepo;
        _playHistoryRepo = playHistoryRepo;
        _fileService = fileService;
        _mapper = mapper;
        _logger = logger;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<SongDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        var result = await _songRepo.GetApprovedAsync(page, pageSize, search);
        return Ok(new PagedResult<SongDto>
        {
            Data = _mapper.Map<List<SongDto>>(result.Data),
            Total = result.Total,
            Page = result.Page,
            PageSize = result.PageSize
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<SongDto>>> GetById(int id)
    {
        var song = await _songRepo.GetByIdAsync(id);
        if (song == null) return NotFound(ApiResponse<SongDto>.Fail("Song not found."));

        // Non-approved songs are only visible to uploader or admin
        if (song.Status != SongStatus.Approved)
        {
            if (!User.Identity?.IsAuthenticated ?? true)
                return NotFound(ApiResponse<SongDto>.Fail("Song not found."));

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var role = User.FindFirstValue(ClaimTypes.Role);
            if (song.UploadedBy != userId && role != "Admin")
                return NotFound(ApiResponse<SongDto>.Fail("Song not found."));
        }

        return Ok(ApiResponse<SongDto>.Ok(_mapper.Map<SongDto>(song)));
    }

    [HttpGet("{id}/stream")]
    public async Task<IActionResult> Stream(int id)
    {
        var song = await _songRepo.GetApprovedByIdAsync(id);
        if (song == null)
        {
            _logger.LogWarning("Stream requested for non-existent or non-approved song {SongId}", id);
            return NotFound();
        }

        var fullPath = _fileService.GetFullPath(song.FilePath);
        if (!System.IO.File.Exists(fullPath))
        {
            _logger.LogError("Audio file missing on disk for song {SongId}: {FilePath}", id, song.FilePath);
            return NotFound();
        }

        // Play count is tracked separately via POST /api/songs/{id}/play (15-second rule)

        var contentType = Path.GetExtension(song.FilePath).ToLower() switch
        {
            ".flac" => "audio/flac",
            ".wav"  => "audio/wav",
            _       => "audio/mpeg"
        };

        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return new FileStreamResult(stream, contentType)
        {
            EnableRangeProcessing = true
        };
    }

    // POST /api/songs/{id}/play — gọi sau khi user đã nghe ≥ 15 giây (frontend rule)
    // Không yêu cầu auth: guest cũng tính lượt nghe, user đăng nhập thêm lịch sử
    [HttpPost("{id}/play")]
    public async Task<IActionResult> RecordPlay(int id)
    {
        var song = await _songRepo.GetApprovedByIdAsync(id);
        if (song == null) return NotFound();

        song.PlayCount++;
        _songRepo.Update(song);

        if (User.Identity?.IsAuthenticated == true)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _playHistoryRepo.AddAsync(new PlayHistory
            {
                UserId   = userId,
                SongId   = song.Id,
                PlayedAt = DateTime.UtcNow,
            });
            _logger.LogInformation("Play recorded for song {SongId} by user {UserId}", id, userId);
        }
        else
        {
            _logger.LogInformation("Play recorded for song {SongId} (anonymous)", id);
        }

        await _playHistoryRepo.SaveChangesAsync();
        return Ok(new { playCount = song.PlayCount });
    }

    // GET /api/songs/my-uploads — bài hát do user hiện tại upload
    [HttpGet("my-uploads")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<List<SongDto>>>> MyUploads()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var songs = await _songRepo.GetByUploadedByAsync(userId);
        return Ok(ApiResponse<List<SongDto>>.Ok(_mapper.Map<List<SongDto>>(songs)));
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ApiResponse<SongDto>>> Create([FromForm] CreateSongDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var role = User.FindFirstValue(ClaimTypes.Role)!;

        var primaryArtistId = dto.ArtistIds.FirstOrDefault();

        string filePath;
        try
        {
            filePath = await _fileService.SaveAudioAsync(dto.File, primaryArtistId);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Upload failed for user {UserId}: {Reason}", userId, ex.Message);
            return BadRequest(ApiResponse<SongDto>.Fail(ex.Message));
        }

        // Optional cover image
        string? coverUrl = null;
        if (dto.CoverFile != null)
        {
            try { coverUrl = await _fileService.SaveImageAsync(dto.CoverFile, "songs"); }
            catch (Exception ex)
            {
                _logger.LogWarning("Cover upload failed for user {UserId}: {Reason}", userId, ex.Message);
                // Non-fatal — proceed without cover
            }
        }

        var status = role switch
        {
            "Admin"   => SongStatus.Approved,
            "UserPro" => SongStatus.Approved,
            _         => SongStatus.Pending
        };

        var song = new Song
        {
            Title           = dto.Title,
            ArtistId        = primaryArtistId,
            AlbumId         = dto.AlbumId,
            FilePath        = filePath,
            CoverUrl        = coverUrl,
            Description     = dto.Description,
            Lyrics          = dto.Lyrics,
            DurationSeconds = dto.DurationSeconds,
            Status          = status,
            UploadedBy      = userId,
            UploadedAt      = DateTime.UtcNow
        };

        await _songRepo.AddAsync(song);
        await _songRepo.SaveChangesAsync();

        // Assign genres
        if (dto.GenreIds.Any())
        {
            foreach (var genreId in dto.GenreIds.Distinct())
            {
                _context.SongGenres.Add(new SongGenre { SongId = song.Id, GenreId = genreId });
            }
            await _context.SaveChangesAsync();
        }

        // Assign co-artists
        if (dto.ArtistIds.Any())
        {
            int order = 0;
            foreach (var artistId in dto.ArtistIds.Distinct())
            {
                _context.SongArtists.Add(new SongArtist { SongId = song.Id, ArtistId = artistId, Order = order++ });
            }
            await _context.SaveChangesAsync();
        }

        _logger.LogInformation(
            "Song '{Title}' uploaded by user {UserId} (role: {Role}) → status: {Status}",
            song.Title, userId, role, status);

        var created = await _songRepo.GetByIdAsync(song.Id);
        return CreatedAtAction(nameof(GetById), new { id = song.Id },
            ApiResponse<SongDto>.Ok(_mapper.Map<SongDto>(created!)));
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var song = await _songRepo.GetByIdAsync(id);
        if (song == null) return NotFound(ApiResponse<object>.Fail("Song not found."));

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var role = User.FindFirstValue(ClaimTypes.Role);

        if (song.UploadedBy != userId && role != "Admin")
        {
            _logger.LogWarning(
                "Unauthorized delete attempt: user {UserId} tried to delete song {SongId}", userId, id);
            return StatusCode(403, ApiResponse<object>.Fail("You don't have permission to delete this song."));
        }

        await _fileService.DeleteFileAsync(song.FilePath);
        if (!string.IsNullOrEmpty(song.CoverUrl))
            await _fileService.DeleteFileAsync(song.CoverUrl);
        _songRepo.Delete(song);
        await _songRepo.SaveChangesAsync();

        _logger.LogInformation("Song {SongId} '{Title}' deleted by user {UserId}", id, song.Title, userId);
        return NoContent();
    }
}
