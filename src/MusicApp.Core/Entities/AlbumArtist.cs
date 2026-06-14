namespace MusicApp.Core.Entities;
public class AlbumArtist
{
    public int AlbumId { get; set; }
    public int ArtistId { get; set; }
    public int Order { get; set; } = 0;
    public Album Album { get; set; } = null!;
    public Artist Artist { get; set; } = null!;
}
