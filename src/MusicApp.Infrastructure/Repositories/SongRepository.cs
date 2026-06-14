using Microsoft.EntityFrameworkCore;
using MusicApp.Core.DTOs.Common;
using MusicApp.Core.Entities;
using MusicApp.Core.Enums;
using MusicApp.Core.Interfaces.Repositories;
using MusicApp.Infrastructure.Data;

namespace MusicApp.Infrastructure.Repositories;

public class SongRepository : BaseRepository<Song>, ISongRepository
{
    public SongRepository(AppDbContext context) : base(context) { }

    public async Task<PagedResult<Song>> GetApprovedAsync(int page, int pageSize, string? search = null)
    {
        var query = _context.Songs
            .Include(s => s.Artist)
            .Include(s => s.SongArtists).ThenInclude(sa => sa.Artist)
            .Include(s => s.Album)
            .Include(s => s.SongGenres).ThenInclude(sg => sg.Genre)
            .Where(s => s.Status == SongStatus.Approved);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            query = query.Where(s =>
                s.Title.ToLower().Contains(lower) ||
                s.Artist.Name.ToLower().Contains(lower));
        }

        var total = await query.CountAsync();
        var data = await query
            .OrderByDescending(s => s.UploadedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Song>
        {
            Data = data,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PagedResult<Song>> GetAllForAdminAsync(int page, int pageSize, string? search = null, string? status = null)
    {
        var query = _context.Songs
            .Include(s => s.Artist)
            .Include(s => s.SongArtists).ThenInclude(sa => sa.Artist)
            .Include(s => s.Album)
            .Include(s => s.Uploader)
            .Include(s => s.SongGenres).ThenInclude(sg => sg.Genre)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            query = query.Where(s =>
                s.Title.ToLower().Contains(lower) ||
                s.Artist.Name.ToLower().Contains(lower));
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<SongStatus>(status, true, out var statusEnum))
            query = query.Where(s => s.Status == statusEnum);

        var total = await query.CountAsync();
        var data = await query
            .OrderByDescending(s => s.UploadedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Song> { Data = data, Total = total, Page = page, PageSize = pageSize };
    }

    public async Task<IEnumerable<Song>> GetPendingAsync()
    {
        return await _context.Songs
            .Include(s => s.Artist)
            .Include(s => s.SongArtists).ThenInclude(sa => sa.Artist)
            .Include(s => s.Uploader)
            .Include(s => s.SongGenres).ThenInclude(sg => sg.Genre)
            .Where(s => s.Status == SongStatus.Pending)
            .OrderByDescending(s => s.UploadedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Song>> GetByArtistAsync(int artistId, int page, int pageSize)
    {
        return await _context.Songs
            .Include(s => s.Artist)
            .Include(s => s.SongArtists).ThenInclude(sa => sa.Artist)
            .Include(s => s.Album)
            .Include(s => s.SongGenres).ThenInclude(sg => sg.Genre)
            .Where(s => s.ArtistId == artistId && s.Status == SongStatus.Approved)
            .OrderByDescending(s => s.UploadedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<IEnumerable<Song>> GetByAlbumAsync(int albumId)
    {
        return await _context.Songs
            .Include(s => s.Artist)
            .Include(s => s.SongArtists).ThenInclude(sa => sa.Artist)
            .Include(s => s.SongGenres).ThenInclude(sg => sg.Genre)
            .Where(s => s.AlbumId == albumId && s.Status == SongStatus.Approved)
            .OrderBy(s => s.Id)
            .ToListAsync();
    }

    public async Task<IEnumerable<Song>> GetByUploadedByAsync(int userId)
    {
        return await _context.Songs
            .Include(s => s.Artist)
            .Include(s => s.SongArtists).ThenInclude(sa => sa.Artist)
            .Include(s => s.Album)
            .Include(s => s.Uploader)
            .Include(s => s.SongGenres).ThenInclude(sg => sg.Genre)
            .Where(s => s.UploadedBy == userId)
            .OrderByDescending(s => s.UploadedAt)
            .ToListAsync();
    }

    public async Task<Song?> GetApprovedByIdAsync(int id)
    {
        return await _context.Songs
            .Include(s => s.Artist)
            .Include(s => s.SongArtists).ThenInclude(sa => sa.Artist)
            .Include(s => s.Album)
            .Include(s => s.SongGenres).ThenInclude(sg => sg.Genre)
            .FirstOrDefaultAsync(s => s.Id == id && s.Status == SongStatus.Approved);
    }

    public override async Task<Song?> GetByIdAsync(int id)
    {
        return await _context.Songs
            .Include(s => s.Artist)
            .Include(s => s.SongArtists).ThenInclude(sa => sa.Artist)
            .Include(s => s.Album)
            .Include(s => s.SongGenres).ThenInclude(sg => sg.Genre)
            .FirstOrDefaultAsync(s => s.Id == id);
    }
}
