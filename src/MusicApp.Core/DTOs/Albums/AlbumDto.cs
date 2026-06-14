namespace MusicApp.Core.DTOs.Albums;

public class AlbumDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int ArtistId { get; set; }
    public string ArtistName { get; set; } = string.Empty;
    public string? CoverUrl { get; set; }
    public int ReleaseYear { get; set; }
}
