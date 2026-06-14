using FluentValidation;
using MusicApp.Core.DTOs.Artists;

namespace MusicApp.API.Validators;

public class CreateArtistDtoValidator : AbstractValidator<CreateArtistDto>
{
    private static readonly string[] AllowedImageExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private const long MaxImageSizeBytes = 5 * 1024 * 1024; // 5 MB

    public CreateArtistDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Artist name is required.")
            .MaximumLength(100).WithMessage("Artist name must not exceed 100 characters.");

        RuleFor(x => x.Bio)
            .MaximumLength(2000).WithMessage("Bio must not exceed 2000 characters.")
            .When(x => x.Bio != null);

        RuleFor(x => x.AvatarFile)
            .Must(f => f == null || f.Length <= MaxImageSizeBytes)
                .WithMessage("Avatar image must not exceed 5 MB.")
            .Must(f => f == null || AllowedImageExtensions.Contains(
                Path.GetExtension(f.FileName).ToLowerInvariant()))
                .WithMessage("Avatar must be a .jpg, .jpeg, .png, or .webp file.")
            .When(x => x.AvatarFile != null);
    }
}
