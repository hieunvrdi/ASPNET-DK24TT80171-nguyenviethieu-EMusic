using Microsoft.EntityFrameworkCore;
using MusicApp.Core.Entities;
using MusicApp.Core.Interfaces.Repositories;
using MusicApp.Infrastructure.Data;

namespace MusicApp.Infrastructure.Repositories;

public class ArtistRepository : BaseRepository<Artist>, IArtistRepository
{
    public ArtistRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<Artist>> GetAllWithSongCountAsync()
        => await _context.Artists.Include(a => a.Songs).ToListAsync();
}
