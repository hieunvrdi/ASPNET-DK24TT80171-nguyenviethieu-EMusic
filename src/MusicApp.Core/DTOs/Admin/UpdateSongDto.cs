using Microsoft.AspNetCore.Http;

namespace MusicApp.Core.DTOs.Admin;

public class UpdateSongDto
{
    public string Title { get; set; } = string.Empty;
    public List<int> ArtistIds { get; set; } = new();
    public int? AlbumId { get; set; }
    public string Status { get; set; } = string.Empty;
    public IFormFile? CoverFile { get; set; }
    public string? Description { get; set; }
    public string? Lyrics { get; set; }
    public List<int> GenreIds { get; set; } = new();
}
