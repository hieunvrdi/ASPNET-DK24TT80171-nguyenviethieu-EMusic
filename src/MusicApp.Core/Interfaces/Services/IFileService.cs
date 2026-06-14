using Microsoft.AspNetCore.Http;
// IFormFile is from Microsoft.AspNetCore.Http.Abstractions

namespace MusicApp.Core.Interfaces.Services;

public interface IFileService
{
    Task<string> SaveAudioAsync(IFormFile file, int artistId);
    Task<string> SaveImageAsync(IFormFile file, string folder);
    Task DeleteFileAsync(string relativePath);
    string GetFullPath(string relativePath);
}
