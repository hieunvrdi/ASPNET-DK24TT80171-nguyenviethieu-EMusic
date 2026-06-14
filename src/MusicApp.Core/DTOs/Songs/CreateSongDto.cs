using Microsoft.AspNetCore.Http;

namespace MusicApp.Core.DTOs.Songs;

public class CreateSongDto
{
    public string Title { get; set; } = string.Empty;
    public List<int> ArtistIds { get; set; } = new();
    public int? AlbumId { get; set; }
    public int DurationSeconds { get; set; }
    public IFormFile File { get; set; } = null!;
    public IFormFile? CoverFile { get; set; }
    public string? Description { get; set; }
    public string? Lyrics { get; set; }
    public List<int> GenreIds { get; set; } = new();
}
