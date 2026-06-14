namespace MusicApp.Core.Entities;
public class SongArtist
{
    public int SongId { get; set; }
    public int ArtistId { get; set; }
    public int Order { get; set; } = 0;
    public Song Song { get; set; } = null!;
    public Artist Artist { get; set; } = null!;
}
