namespace MusicApp.Core.Entities;

public class PlaylistSong
{
    public int PlaylistId { get; set; }
    public int SongId { get; set; }
    public int OrderIndex { get; set; }

    public Playlist Playlist { get; set; } = null!;
    public Song Song { get; set; } = null!;
}
