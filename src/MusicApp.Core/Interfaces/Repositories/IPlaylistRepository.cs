using MusicApp.Core.Entities;

namespace MusicApp.Core.Interfaces.Repositories;

public interface IPlaylistRepository : IRepository<Playlist>
{
    Task<IEnumerable<Playlist>> GetByUserIdAsync(int userId);
    Task<Playlist?> GetWithSongsAsync(int id);
}
