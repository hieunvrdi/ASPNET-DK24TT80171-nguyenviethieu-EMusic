using Microsoft.AspNetCore.Http;

namespace MusicApp.Core.DTOs.Albums;

public class CreateAlbumDto
{
    public string Title { get; set; } = string.Empty;
    public int ArtistId { get; set; }
    public int ReleaseYear { get; set; }
    public IFormFile? CoverFile { get; set; }
}
