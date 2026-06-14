using FluentValidation;
using MusicApp.Core.DTOs.Songs;

namespace MusicApp.API.Validators;

public class CreateSongDtoValidator : AbstractValidator<CreateSongDto>
{
    private static readonly string[] AllowedExtensions = [".mp3", ".flac", ".wav"];
    private const long MaxFileSizeBytes = 50 * 1024 * 1024; // 50 MB

    public CreateSongDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");

        RuleFor(x => x.ArtistIds)
            .NotEmpty().WithMessage("At least one ArtistId is required.")
            .Must(ids => ids.All(id => id > 0)).WithMessage("All ArtistIds must be greater than 0.");

        RuleFor(x => x.DurationSeconds)
            .GreaterThan(0).WithMessage("DurationSeconds must be greater than 0.");

        RuleFor(x => x.File)
            .NotNull().WithMessage("Audio file is required.")
            .Must(f => f == null || f.Length <= MaxFileSizeBytes)
                .WithMessage("File size must not exceed 50 MB.")
            .Must(f => f == null || AllowedExtensions.Contains(
                Path.GetExtension(f.FileName).ToLowerInvariant()))
                .WithMessage("Only .mp3, .flac, and .wav files are allowed.");
    }
}
