using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using MusicApp.Core.Interfaces.Services;

namespace MusicApp.Infrastructure.Services;

public class FileService : IFileService
{
    private static readonly HashSet<string> AllowedAudioExtensions = new(StringComparer.OrdinalIgnoreCase)
        { ".mp3", ".flac", ".wav" };
    private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
        { ".jpg", ".jpeg", ".png", ".webp" };
    private const long MaxAudioSizeBytes = 52_428_800; // 50MB
    private const long MaxImageSizeBytes = 5_242_880;  // 5MB

    private readonly IHostEnvironment _env;

    public FileService(IHostEnvironment env) => _env = env;

    public async Task<string> SaveAudioAsync(IFormFile file, int artistId)
    {
        var ext = Path.GetExtension(file.FileName).ToLower();
        if (!AllowedAudioExtensions.Contains(ext))
            throw new ArgumentException($"File extension '{ext}' is not allowed. Use .mp3, .flac, or .wav.");

        if (file.Length > MaxAudioSizeBytes)
            throw new ArgumentException("File size exceeds 50MB limit.");

        var folder = Path.Combine(_env.ContentRootPath, "uploads", "songs", artistId.ToString());
        Directory.CreateDirectory(folder);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var fullPath = Path.Combine(folder, fileName);

        using var stream = new FileStream(fullPath, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"/songs/{artistId}/{fileName}";
    }

    public async Task<string> SaveImageAsync(IFormFile file, string folder)
    {
        var ext = Path.GetExtension(file.FileName).ToLower();
        if (!AllowedImageExtensions.Contains(ext))
            throw new ArgumentException($"Image extension '{ext}' is not allowed.");

        if (file.Length > MaxImageSizeBytes)
            throw new ArgumentException("Image size exceeds 5MB limit.");

        var targetFolder = Path.Combine(_env.ContentRootPath, "uploads", "images", folder);
        Directory.CreateDirectory(targetFolder);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var fullPath = Path.Combine(targetFolder, fileName);

        using var stream = new FileStream(fullPath, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"/images/{folder}/{fileName}";
    }

    public Task DeleteFileAsync(string relativePath)
    {
        var fullPath = GetFullPath(relativePath);
        if (File.Exists(fullPath))
            File.Delete(fullPath);
        return Task.CompletedTask;
    }

    public string GetFullPath(string relativePath)
        // Strip leading '/' to support both old paths ("images/...") and new paths ("/images/...")
        => Path.Combine(_env.ContentRootPath, "uploads", relativePath.TrimStart('/'));
}
