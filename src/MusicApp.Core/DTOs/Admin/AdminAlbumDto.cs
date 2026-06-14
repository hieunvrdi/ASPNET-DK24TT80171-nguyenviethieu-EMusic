using MusicApp.Core.DTOs.Artists;

namespace MusicApp.Core.DTOs.Admin;

public class AdminAlbumDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int ArtistId { get; set; }
    public string ArtistName { get; set; } = string.Empty;
    public string? CoverUrl { get; set; }
    public int ReleaseYear { get; set; }
    public int SongCount { get; set; }
    public List<ArtistBriefDto> Artists { get; set; } = new();
}
