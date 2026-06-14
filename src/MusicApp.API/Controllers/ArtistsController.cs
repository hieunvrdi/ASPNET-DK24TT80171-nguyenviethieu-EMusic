using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MusicApp.Core.DTOs.Artists;
using MusicApp.Core.DTOs.Common;
using MusicApp.Core.DTOs.Songs;
using MusicApp.Core.Entities;
using MusicApp.Core.Interfaces.Repositories;
using MusicApp.Core.Interfaces.Services;
using System.Security.Claims;

namespace MusicApp.API.Controllers;

[ApiController]
[Route("api/artists")]
public class ArtistsController : ControllerBase
{
    private readonly IArtistRepository _artistRepo;
    private readonly ISongRepository _songRepo;
    private readonly IFileService _fileService;
    private readonly IMapper _mapper;

    public ArtistsController(
        IArtistRepository artistRepo,
        ISongRepository songRepo,
        IFileService fileService,
        IMapper mapper)
    {
        _artistRepo = artistRepo;
        _songRepo = songRepo;
        _fileService = fileService;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ArtistDto>>>> GetAll()
    {
        var artists = await _artistRepo.GetAllAsync();
        return Ok(ApiResponse<List<ArtistDto>>.Ok(_mapper.Map<List<ArtistDto>>(artists)));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ArtistDto>>> GetById(int id)
    {
        var artist = await _artistRepo.GetByIdAsync(id);
        if (artist == null) return NotFound(ApiResponse<ArtistDto>.Fail("Artist not found."));
        return Ok(ApiResponse<ArtistDto>.Ok(_mapper.Map<ArtistDto>(artist)));
    }

    [HttpGet("{id}/songs")]
    public async Task<ActionResult<PagedResult<SongDto>>> GetSongs(
        int id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var artist = await _artistRepo.GetByIdAsync(id);
        if (artist == null) return NotFound();

        var songs = await _songRepo.GetByArtistAsync(id, page, pageSize);
        return Ok(new PagedResult<SongDto>
        {
            Data = _mapper.Map<List<SongDto>>(songs),
            Total = songs.Count(),
            Page = page,
            PageSize = pageSize
        });
    }

    // PUT /api/artists/{id} — chỉ Admin (đã có endpoint tương tự trong AdminController, để ở đây cho RESTful)
    [HttpPut("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<ArtistDto>>> Update(int id, [FromForm] UpdateArtistDto dto)
    {
        var artist = await _artistRepo.GetByIdAsync(id);
        if (artist == null) return NotFound(ApiResponse<ArtistDto>.Fail("Artist not found."));

        artist.Name = dto.Name;
        artist.Bio  = dto.Bio;

        if (dto.AvatarFile != null)
        {
            if (!string.IsNullOrEmpty(artist.AvatarUrl))
                await _fileService.DeleteFileAsync(artist.AvatarUrl);
            artist.AvatarUrl = await _fileService.SaveImageAsync(dto.AvatarFile, "artists");
        }

        _artistRepo.Update(artist);
        await _artistRepo.SaveChangesAsync();

        return Ok(ApiResponse<ArtistDto>.Ok(_mapper.Map<ArtistDto>(artist)));
    }

    // DELETE /api/artists/{id} — chỉ Admin
    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(int id)
    {
        // Dùng GetAllWithSongCountAsync để check songs
        var artistWithSongs = (await _artistRepo.GetAllWithSongCountAsync())
            .FirstOrDefault(a => a.Id == id);

        if (artistWithSongs == null) return NotFound(ApiResponse<object>.Fail("Artist not found."));

        if (artistWithSongs.Songs.Any())
            return BadRequest(ApiResponse<object>.Fail(
                $"Không thể xóa nhạc sĩ còn {artistWithSongs.Songs.Count} bài hát. Hãy xóa bài hát trước."));

        if (!string.IsNullOrEmpty(artistWithSongs.AvatarUrl))
            await _fileService.DeleteFileAsync(artistWithSongs.AvatarUrl);

        _artistRepo.Delete(artistWithSongs);
        await _artistRepo.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost]
    [Authorize(Policy = "ProOrAdmin")]
    public async Task<ActionResult<ApiResponse<ArtistDto>>> Create([FromForm] CreateArtistDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        string? avatarUrl = null;
        if (dto.AvatarFile != null)
            avatarUrl = await _fileService.SaveImageAsync(dto.AvatarFile, "artists");

        var artist = new Artist
        {
            Name = dto.Name,
            Bio = dto.Bio,
            AvatarUrl = avatarUrl,
            UploadedBy = userId
        };

        await _artistRepo.AddAsync(artist);
        await _artistRepo.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = artist.Id },
            ApiResponse<ArtistDto>.Ok(_mapper.Map<ArtistDto>(artist)));
    }
}
