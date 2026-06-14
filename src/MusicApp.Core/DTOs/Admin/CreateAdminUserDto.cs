namespace MusicApp.Core.DTOs.Admin;

public class CreateAdminUserDto
{
    public string UserName { get; set; } = string.Empty;
    public string Email    { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role     { get; set; } = "User";
}
