namespace MusicApp.Core.DTOs.Admin;

public class StatsDto
{
    public int TotalUsers { get; set; }
    public int TotalSongs { get; set; }
    public int TotalApproved { get; set; }
    public int TotalPending { get; set; }
    public int TotalPlays { get; set; }
    public int TotalArtists { get; set; }
    public int TotalAlbums { get; set; }
}
