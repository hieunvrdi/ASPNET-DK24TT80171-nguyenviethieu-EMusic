namespace MusicApp.Core.Entities;

public class Album
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int ArtistId { get; set; }
    public string? CoverUrl { get; set; }
    public int ReleaseYear { get; set; }

    public Artist Artist { get; set; } = null!;
    public ICollection<Song> Songs { get; set; } = new List<Song>();
    public ICollection<AlbumArtist> AlbumArtists { get; set; } = new List<AlbumArtist>();
}
