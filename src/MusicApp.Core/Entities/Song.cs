using MusicApp.Core.Enums;

namespace MusicApp.Core.Entities;

public class Song
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int ArtistId { get; set; }
    public int? AlbumId { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public string? CoverUrl { get; set; }
    public string? Description { get; set; }
    public string? Lyrics { get; set; }
    public int DurationSeconds { get; set; }
    public int PlayCount { get; set; } = 0;
    public SongStatus Status { get; set; } = SongStatus.Pending;
    public int UploadedBy { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public Artist Artist { get; set; } = null!;
    public Album? Album { get; set; }
    public User Uploader { get; set; } = null!;
    public ICollection<PlaylistSong> PlaylistSongs { get; set; } = new List<PlaylistSong>();
    public ICollection<PlayHistory> PlayHistories { get; set; } = new List<PlayHistory>();
    public ICollection<FavoriteSong> FavoriteSongs { get; set; } = new List<FavoriteSong>();
    public ICollection<SongGenre> SongGenres { get; set; } = new List<SongGenre>();
    public ICollection<SongArtist> SongArtists { get; set; } = new List<SongArtist>();
}
