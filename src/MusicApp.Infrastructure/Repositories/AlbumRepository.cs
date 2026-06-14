using Microsoft.EntityFrameworkCore;
using MusicApp.Core.Entities;
using MusicApp.Core.Interfaces.Repositories;
using MusicApp.Infrastructure.Data;

namespace MusicApp.Infrastructure.Repositories;

public class AlbumRepository : BaseRepository<Album>, IAlbumRepository
{
    public AlbumRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<Album>> GetByArtistAsync(int artistId)
        => await _context.Albums
            .Include(a => a.Artist)
            .Where(a => a.ArtistId == artistId)
            .ToListAsync();

    public override async Task<Album?> GetByIdAsync(int id)
        => await _context.Albums.Include(a => a.Artist).FirstOrDefaultAsync(a => a.Id == id);
}
