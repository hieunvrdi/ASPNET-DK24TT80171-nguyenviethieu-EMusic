using Microsoft.AspNetCore.Http;

namespace MusicApp.Core.DTOs.Artists;

public class CreateArtistDto
{
    public string Name { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public IFormFile? AvatarFile { get; set; }
}
