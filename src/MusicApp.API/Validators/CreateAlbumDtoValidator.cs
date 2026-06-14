using FluentValidation;
using MusicApp.Core.DTOs.Albums;

namespace MusicApp.API.Validators;

public class CreateAlbumDtoValidator : AbstractValidator<CreateAlbumDto>
{
    private static readonly string[] AllowedImageExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private const long MaxImageSizeBytes = 5 * 1024 * 1024; // 5 MB

    public CreateAlbumDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Album title is required.")
            .MaximumLength(200).WithMessage("Album title must not exceed 200 characters.");

        RuleFor(x => x.ArtistId)
            .GreaterThan(0).WithMessage("A valid ArtistId is required.");

        RuleFor(x => x.ReleaseYear)
            .InclusiveBetween(1900, DateTime.UtcNow.Year + 1)
            .WithMessage($"Release year must be between 1900 and {DateTime.UtcNow.Year + 1}.");

        RuleFor(x => x.CoverFile)
            .Must(f => f == null || f.Length <= MaxImageSizeBytes)
                .WithMessage("Cover image must not exceed 5 MB.")
            .Must(f => f == null || AllowedImageExtensions.Contains(
                Path.GetExtension(f.FileName).ToLowerInvariant()))
                .WithMessage("Cover must be a .jpg, .jpeg, .png, or .webp file.")
            .When(x => x.CoverFile != null);
    }
}
