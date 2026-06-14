namespace MusicApp.Core.Entities;

public class User
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "User";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Song> UploadedSongs { get; set; } = new List<Song>();
    public ICollection<Artist> CreatedArtists { get; set; } = new List<Artist>();
    public ICollection<Playlist> Playlists { get; set; } = new List<Playlist>();
    public ICollection<PlayHistory> PlayHistories { get; set; } = new List<PlayHistory>();
    public ICollection<FavoriteSong> FavoriteSongs { get; set; } = new List<FavoriteSong>();
}
