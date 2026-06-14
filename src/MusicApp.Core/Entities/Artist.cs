namespace MusicApp.Core.Entities;

public class Artist
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public int UploadedBy { get; set; }

    public User Uploader { get; set; } = null!;
    public ICollection<Song> Songs { get; set; } = new List<Song>();
    public ICollection<Album> Albums { get; set; } = new List<Album>();
    public ICollection<SongArtist> SongArtists { get; set; } = new List<SongArtist>();
    public ICollection<AlbumArtist> AlbumArtists { get; set; } = new List<AlbumArtist>();
}
