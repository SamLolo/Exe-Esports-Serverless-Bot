import { UserDto } from "./UserDto";

export interface OverwriteDto {
    id: string,
    type: number,
    allow: string,
    deny: string
}

export interface ChannelDto {
    id: string,
    type: number,
    guild_id?: any,
    position?: number,
    permission_overwrites?: OverwriteDto,
    name?: string,
    topic?: string,
    nsfw?: boolean,
    last_message_id?: any,
    bitrate?: number,
    user_limit?: number,
    rate_limit_per_user?: number,
    recipients?: Array<UserDto>,
    icon?: string | undefined,
    owner_id?: string,
    application_id?: string,
    managed?: boolean,
    parent_id?: string,
    last_pin_timestamp?: Date | null,
    rtc_region?: string | null,
    video_quality_mode: number,
    message_count?: number,
    member_count?: number,
    default_auto_archive_duration?: number,
    permissions?: string,
    flags: number,
    total_message_sent?: number,
    default_thread_rate_limit_per_user?: number,
    default_sort_order?: number | null
}