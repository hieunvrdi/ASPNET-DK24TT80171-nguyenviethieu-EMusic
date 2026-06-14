using MusicApp.Core.DTOs.Songs;

namespace MusicApp.Core.DTOs.Playlists;

public class PlaylistDetailDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsPublic { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<SongDto> Songs { get; set; } = new();
}
