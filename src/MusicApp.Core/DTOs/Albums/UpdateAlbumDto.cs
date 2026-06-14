using Microsoft.AspNetCore.Http;

namespace MusicApp.Core.DTOs.Albums;

public class UpdateAlbumDto
{
    public string Title { get; set; } = string.Empty;
    public int ArtistId { get; set; }
    public List<int> ArtistIds { get; set; } = new();
    public int ReleaseYear { get; set; }
    public IFormFile? CoverFile { get; set; }
}
