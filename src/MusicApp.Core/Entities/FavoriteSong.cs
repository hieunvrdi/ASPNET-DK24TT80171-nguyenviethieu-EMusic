namespace MusicApp.Core.Entities;

public class FavoriteSong
{
    public int UserId { get; set; }
    public int SongId { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Song Song { get; set; } = null!;
}
