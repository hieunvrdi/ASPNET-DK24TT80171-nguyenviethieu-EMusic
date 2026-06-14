namespace MusicApp.Core.DTOs.Admin;

public class UpdateAdminUserDto
{
    public string  UserName    { get; set; } = string.Empty;
    public string  Email       { get; set; } = string.Empty;
    public string  Role        { get; set; } = string.Empty;
    /// <summary>Để trống = không đổi mật khẩu</summary>
    public string? NewPassword { get; set; }
}
