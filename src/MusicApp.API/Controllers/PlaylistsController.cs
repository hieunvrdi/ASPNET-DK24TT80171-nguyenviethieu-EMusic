using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MusicApp.Core.DTOs.Common;
using MusicApp.Core.DTOs.Playlists;
using MusicApp.Core.Entities;
using MusicApp.Core.Interfaces.Repositories;
using System.Security.Claims;

namespace MusicApp.API.Controllers;

[ApiController]
[Route("api/playlists")]
[Authorize]
public class PlaylistsController : ControllerBase
{
    private readonly IPlaylistRepository _playlistRepo;
    private readonly ISongRepository _songRepo;
    private readonly IMapper _mapper;

    public PlaylistsController(
        IPlaylistRepository playlistRepo,
        ISongRepository songRepo,
        IMapper mapper)
    {
        _playlistRepo = playlistRepo;
        _songRepo = songRepo;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<PlaylistDto>>>> GetMine()
    {
        var userId = GetUserId();
        var playlists = await _playlistRepo.GetByUserIdAsync(userId);
        return Ok(ApiResponse<List<PlaylistDto>>.Ok(_mapper.Map<List<PlaylistDto>>(playlists)));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<PlaylistDetailDto>>> GetById(int id)
    {
        var playlist = await _playlistRepo.GetWithSongsAsync(id);
        if (playlist == null)
            return NotFound(ApiResponse<PlaylistDetailDto>.Fail("Playlist not found."));

        var userId = GetUserId();
        if (playlist.UserId != userId && !playlist.IsPublic)
            return StatusCode(403, ApiResponse<PlaylistDetailDto>.Fail("Access denied."));

        return Ok(ApiResponse<PlaylistDetailDto>.Ok(_mapper.Map<PlaylistDetailDto>(playlist)));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<PlaylistDto>>> Create([FromBody] CreatePlaylistDto dto)
    {
        var userId = GetUserId();
        var playlist = new Playlist
        {
            UserId = userId,
            Name = dto.Name,
            IsPublic = dto.IsPublic,
            CreatedAt = DateTime.UtcNow
        };

        await _playlistRepo.AddAsync(playlist);
        await _playlistRepo.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = playlist.Id },
            ApiResponse<PlaylistDto>.Ok(_mapper.Map<PlaylistDto>(playlist)));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<PlaylistDto>>> Update(int id, [FromBody] UpdatePlaylistDto dto)
    {
        var playlist = await _playlistRepo.GetByIdAsync(id);
        if (playlist == null)
            return NotFound(ApiResponse<PlaylistDto>.Fail("Playlist not found."));

        if (playlist.UserId != GetUserId())
            return StatusCode(403, ApiResponse<PlaylistDto>.Fail("Access denied."));

        playlist.Name = dto.Name;
        playlist.IsPublic = dto.IsPublic;
        _playlistRepo.Update(playlist);
        await _playlistRepo.SaveChangesAsync();

        return Ok(ApiResponse<PlaylistDto>.Ok(_mapper.Map<PlaylistDto>(playlist)));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var playlist = await _playlistRepo.GetByIdAsync(id);
        if (playlist == null)
            return NotFound(ApiResponse<object>.Fail("Playlist not found."));

        if (playlist.UserId != GetUserId())
            return StatusCode(403, ApiResponse<object>.Fail("Access denied."));

        _playlistRepo.Delete(playlist);
        await _playlistRepo.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/songs")]
    public async Task<IActionResult> AddSong(int id, [FromBody] AddSongToPlaylistDto dto)
    {
        var playlist = await _playlistRepo.GetWithSongsAsync(id);
        if (playlist == null)
            return NotFound(ApiResponse<object>.Fail("Playlist not found."));

        if (playlist.UserId != GetUserId())
            return StatusCode(403, ApiResponse<object>.Fail("Access denied."));

        if (playlist.PlaylistSongs.Any(ps => ps.SongId == dto.SongId))
            return BadRequest(ApiResponse<object>.Fail("Song already in playlist."));

        var song = await _songRepo.GetApprovedByIdAsync(dto.SongId);
        if (song == null)
            return NotFound(ApiResponse<object>.Fail("Song not found."));

        var maxOrder = playlist.PlaylistSongs.Any()
            ? playlist.PlaylistSongs.Max(ps => ps.OrderIndex)
            : -1;

        playlist.PlaylistSongs.Add(new PlaylistSong
        {
            PlaylistId = id,
            SongId = dto.SongId,
            OrderIndex = maxOrder + 1
        });

        _playlistRepo.Update(playlist);
        await _playlistRepo.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}/songs/{songId}")]
    public async Task<IActionResult> RemoveSong(int id, int songId)
    {
        var playlist = await _playlistRepo.GetWithSongsAsync(id);
        if (playlist == null)
            return NotFound(ApiResponse<object>.Fail("Playlist not found."));

        if (playlist.UserId != GetUserId())
            return StatusCode(403, ApiResponse<object>.Fail("Access denied."));

        var entry = playlist.PlaylistSongs.FirstOrDefault(ps => ps.SongId == songId);
        if (entry == null)
            return NotFound(ApiResponse<object>.Fail("Song not in playlist."));

        playlist.PlaylistSongs.Remove(entry);
        _playlistRepo.Update(playlist);
        await _playlistRepo.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id}/reorder")]
    public async Task<IActionResult> Reorder(int id, [FromBody] ReorderPlaylistDto dto)
    {
        var playlist = await _playlistRepo.GetWithSongsAsync(id);
        if (playlist == null)
            return NotFound(ApiResponse<object>.Fail("Playlist not found."));

        if (playlist.UserId != GetUserId())
            return StatusCode(403, ApiResponse<object>.Fail("Access denied."));

        for (int i = 0; i < dto.SongIds.Count; i++)
        {
            var entry = playlist.PlaylistSongs.FirstOrDefault(ps => ps.SongId == dto.SongIds[i]);
            if (entry != null)
                entry.OrderIndex = i;
        }

        _playlistRepo.Update(playlist);
        await _playlistRepo.SaveChangesAsync();
        return NoContent();
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
