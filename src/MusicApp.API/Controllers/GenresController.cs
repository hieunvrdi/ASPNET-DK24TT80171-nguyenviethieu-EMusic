using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MusicApp.Core.DTOs.Common;
using MusicApp.Core.DTOs.Genres;
using MusicApp.Infrastructure.Data;

namespace MusicApp.API.Controllers;

[ApiController]
[Route("api/genres")]
public class GenresController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public GenresController(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<GenreDto>>>> GetAll()
    {
        var genres = await _context.Genres
            .Include(g => g.SongGenres)
            .OrderBy(g => g.Name)
            .ToListAsync();
        return Ok(ApiResponse<List<GenreDto>>.Ok(_mapper.Map<List<GenreDto>>(genres)));
    }
}
