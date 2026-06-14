using MusicApp.Core.DTOs.Common;
using MusicApp.Core.Entities;
using MusicApp.Core.Enums;

namespace MusicApp.Core.Interfaces.Repositories;

public interface ISongRepository : IRepository<Song>
{
    Task<PagedResult<Song>> GetApprovedAsync(int page, int pageSize, string? search = null);
    Task<PagedResult<Song>> GetAllForAdminAsync(int page, int pageSize, string? search = null, string? status = null);
    Task<IEnumerable<Song>> GetPendingAsync();
    Task<IEnumerable<Song>> GetByArtistAsync(int artistId, int page, int pageSize);
    Task<IEnumerable<Song>> GetByAlbumAsync(int albumId);
    Task<IEnumerable<Song>> GetByUploadedByAsync(int userId);
    Task<Song?> GetApprovedByIdAsync(int id);
}
