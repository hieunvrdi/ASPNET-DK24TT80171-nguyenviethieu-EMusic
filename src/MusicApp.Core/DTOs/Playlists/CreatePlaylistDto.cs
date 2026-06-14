namespace MusicApp.Core.DTOs.Playlists;

public class CreatePlaylistDto
{
    public string Name { get; set; } = string.Empty;
    public bool IsPublic { get; set; } = false;
}

public class UpdatePlaylistDto
{
    public string Name { get; set; } = string.Empty;
    public bool IsPublic { get; set; }
}

public class AddSongToPlaylistDto
{
    public int SongId { get; set; }
}

public class ReorderPlaylistDto
{
    public List<int> SongIds { get; set; } = new();
}
