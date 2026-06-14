using MusicApp.Core.Entities;

namespace MusicApp.Core.Interfaces.Repositories;

public interface IArtistRepository : IRepository<Artist>
{
    Task<IEnumerable<Artist>> GetAllWithSongCountAsync();
}
