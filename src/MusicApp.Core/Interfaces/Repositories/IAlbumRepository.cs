using MusicApp.Core.Entities;

namespace MusicApp.Core.Interfaces.Repositories;

public interface IAlbumRepository : IRepository<Album>
{
    Task<IEnumerable<Album>> GetByArtistAsync(int artistId);
}
