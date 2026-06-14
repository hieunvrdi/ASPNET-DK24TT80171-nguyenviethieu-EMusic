using Microsoft.EntityFrameworkCore;
using MusicApp.Core.Entities;
using MusicApp.Core.Interfaces.Repositories;
using MusicApp.Infrastructure.Data;

namespace MusicApp.Infrastructure.Repositories;

public class PlaylistRepository : BaseRepository<Playlist>, IPlaylistRepository
{
    public PlaylistRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<Playlist>> GetByUserIdAsync(int userId)
        => await _context.Playlists
            .Where(p => p.UserId == userId)
            .Select(p => new Playlist
            {
                Id = p.Id,
                UserId = p.UserId,
                Name = p.Name,
                IsPublic = p.IsPublic,
                CreatedAt = p.CreatedAt,
                PlaylistSongs = p.PlaylistSongs
            })
            .ToListAsync();

    public async Task<Playlist?> GetWithSongsAsync(int id)
        => await _context.Playlists
            .Include(p => p.PlaylistSongs.OrderBy(ps => ps.OrderIndex))
                .ThenInclude(ps => ps.Song)
                    .ThenInclude(s => s.Artist)
            .FirstOrDefaultAsync(p => p.Id == id);
}
