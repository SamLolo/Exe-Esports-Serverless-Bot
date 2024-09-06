
export interface AvatarDecorationDto {
    asset: string,
    sku_id: any
}

export interface UserDto {
    id: string,
    username: string,
    discriminator: string,
    global_name: string | undefined,
    avatar: string | undefined,
    bot?: boolean,
    system?: boolean,
    mfa_enabled?: boolean,
    banner?: string | undefined,
    accent_color?: number | undefined,
    locale?: string,
    verified?: boolean,
    email?: string | undefined,
    flags?: number,
    premium_type?: number,
    public_flags?: number,
    avatar_decoration_data?: AvatarDecorationDto
}