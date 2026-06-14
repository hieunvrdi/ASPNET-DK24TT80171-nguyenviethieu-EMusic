using MusicApp.Core.Entities;

namespace MusicApp.Core.Interfaces.Repositories;

public interface IPlayHistoryRepository
{
    Task AddAsync(PlayHistory history);
    Task<IEnumerable<PlayHistory>> GetByUserAsync(int userId, int limit = 20);
    Task SaveChangesAsync();
}
