using Microsoft.EntityFrameworkCore;
using MusicApp.Core.Entities;
using MusicApp.Core.Interfaces.Repositories;
using MusicApp.Infrastructure.Data;

namespace MusicApp.Infrastructure.Repositories;

public class FavoriteSongRepository : IFavoriteSongRepository
{
    private readonly AppDbContext _context;

    public FavoriteSongRepository(AppDbContext context) => _context = context;

    public async Task<bool> IsFavoriteAsync(int userId, int songId)
        => await _context.FavoriteSongs.AnyAsync(fs => fs.UserId == userId && fs.SongId == songId);

    public async Task<bool> ToggleAsync(int userId, int songId)
    {
        var existing = await _context.FavoriteSongs
            .FirstOrDefaultAsync(fs => fs.UserId == userId && fs.SongId == songId);

        if (existing != null)
        {
            _context.FavoriteSongs.Remove(existing);
            await _context.SaveChangesAsync();
            return false;
        }

        await _context.FavoriteSongs.AddAsync(new FavoriteSong
        {
            UserId = userId,
            SongId = songId,
            AddedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<FavoriteSong>> GetByUserAsync(int userId)
        => await _context.FavoriteSongs
            .Include(fs => fs.Song)
                .ThenInclude(s => s.Artist)
            .Include(fs => fs.Song)
                .ThenInclude(s => s.Album)
            .Where(fs => fs.UserId == userId)
            .OrderByDescending(fs => fs.AddedAt)
            .ToListAsync();

    public async Task SaveChangesAsync() => await _context.SaveChangesAsync();
}
