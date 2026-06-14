namespace MusicApp.Core.DTOs.Playlists;

public class PlaylistDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsPublic { get; set; }
    public int SongCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
