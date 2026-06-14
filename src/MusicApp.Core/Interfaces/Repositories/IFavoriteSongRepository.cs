using MusicApp.Core.Entities;

namespace MusicApp.Core.Interfaces.Repositories;

public interface IFavoriteSongRepository
{
    Task<bool> IsFavoriteAsync(int userId, int songId);
    Task<bool> ToggleAsync(int userId, int songId);
    Task<IEnumerable<FavoriteSong>> GetByUserAsync(int userId);
    Task SaveChangesAsync();
}
