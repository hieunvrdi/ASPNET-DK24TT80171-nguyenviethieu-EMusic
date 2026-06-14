using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MusicApp.Core.DTOs.Albums;
using MusicApp.Core.DTOs.Common;
using MusicApp.Core.DTOs.Songs;
using MusicApp.Core.Entities;
using MusicApp.Core.Interfaces.Repositories;
using MusicApp.Core.Interfaces.Services;
using System.Security.Claims;

namespace MusicApp.API.Controllers;

[ApiController]
[Route("api/albums")]
public class AlbumsController : ControllerBase
{
    private readonly IAlbumRepository _albumRepo;
    private readonly ISongRepository _songRepo;
    private readonly IFileService _fileService;
    private readonly IMapper _mapper;

    public AlbumsController(
        IAlbumRepository albumRepo,
        ISongRepository songRepo,
        IFileService fileService,
        IMapper mapper)
    {
        _albumRepo = albumRepo;
        _songRepo = songRepo;
        _fileService = fileService;
        _mapper = mapper;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<AlbumDto>>> GetById(int id)
    {
        var album = await _albumRepo.GetByIdAsync(id);
        if (album == null) return NotFound(ApiResponse<AlbumDto>.Fail("Album not found."));
        return Ok(ApiResponse<AlbumDto>.Ok(_mapper.Map<AlbumDto>(album)));
    }

    [HttpGet("{id}/songs")]
    public async Task<ActionResult<ApiResponse<List<SongDto>>>> GetSongs(int id)
    {
        var album = await _albumRepo.GetByIdAsync(id);
        if (album == null) return NotFound(ApiResponse<List<SongDto>>.Fail("Album not found."));

        var songs = await _songRepo.GetByAlbumAsync(id);
        return Ok(ApiResponse<List<SongDto>>.Ok(_mapper.Map<List<SongDto>>(songs)));
    }

    [HttpGet("by-artist/{artistId}")]
    public async Task<ActionResult<ApiResponse<List<AlbumDto>>>> GetByArtist(int artistId)
    {
        var albums = await _albumRepo.GetByArtistAsync(artistId);
        return Ok(ApiResponse<List<AlbumDto>>.Ok(_mapper.Map<List<AlbumDto>>(albums)));
    }

    [HttpPost]
    [Authorize(Policy = "ProOrAdmin")]
    public async Task<ActionResult<ApiResponse<AlbumDto>>> Create([FromForm] CreateAlbumDto dto)
    {
        string? coverUrl = null;
        if (dto.CoverFile != null)
            coverUrl = await _fileService.SaveImageAsync(dto.CoverFile, "albums");

        var album = new Album
        {
            Title = dto.Title,
            ArtistId = dto.ArtistId,
            ReleaseYear = dto.ReleaseYear,
            CoverUrl = coverUrl
        };

        await _albumRepo.AddAsync(album);
        await _albumRepo.SaveChangesAsync();

        var created = await _albumRepo.GetByIdAsync(album.Id);
        return CreatedAtAction(nameof(GetById), new { id = album.Id },
            ApiResponse<AlbumDto>.Ok(_mapper.Map<AlbumDto>(created!)));
    }
}
