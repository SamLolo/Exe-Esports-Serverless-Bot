import { ChannelDto } from "./ChannelDto";
import { GuildMemberDto, UserDto } from "./UserDto";

export enum InteractionType {
    PING = 1,
    APPLICATION_COMMAND = 2,
    MESSAGE_COMPONENT = 3,
    APPLICATION_COMMAND_AUTOCOMPLETE = 4,
    MODAL_SUBMIT = 5
}

export interface DiscordInteractionDto {
    id: string,
    application_id: string,
    type: InteractionType,
    data?: InteractionDataDto,
    guild?: any,
    guild_id?: string,
    channel?: ChannelDto,
    channel_id?: string,
    member?: GuildMemberDto,
    user?: UserDto,
    token: string,
    version: 1,
    message?: any,
    app_permissions?: string,
    locale?: string,
    guild_locale?: string,
    entitlements: any,
    authorizing_integration_owners: any,
    context?: any
}

export interface InteractionDataDto {
    id: string,
    name: string,
    type: number,
    resolved?: any,
    options?: Array<any>,
    guild_id?: string,
    target_id?: string
}