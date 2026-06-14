using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MusicApp.Core.DTOs.Common;
using MusicApp.Core.DTOs.Songs;
using MusicApp.Core.Interfaces.Repositories;
using System.Security.Claims;

namespace MusicApp.API.Controllers;

[ApiController]
[Route("api/favorites")]
[Authorize]
public class FavoritesController : ControllerBase
{
    private readonly IFavoriteSongRepository _favoritesRepo;
    private readonly IMapper _mapper;

    public FavoritesController(IFavoriteSongRepository favoritesRepo, IMapper mapper)
    {
        _favoritesRepo = favoritesRepo;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<SongDto>>>> GetFavorites()
    {
        var userId = GetUserId();
        var favorites = await _favoritesRepo.GetByUserAsync(userId);
        var songs = favorites.Select(fs => fs.Song).ToList();
        return Ok(ApiResponse<List<SongDto>>.Ok(_mapper.Map<List<SongDto>>(songs)));
    }

    [HttpPost("{songId}")]
    public async Task<ActionResult<ApiResponse<object>>> Toggle(int songId)
    {
        var userId = GetUserId();
        var isFavorite = await _favoritesRepo.ToggleAsync(userId, songId);
        return Ok(ApiResponse<object>.Ok(new { isFavorite }));
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
