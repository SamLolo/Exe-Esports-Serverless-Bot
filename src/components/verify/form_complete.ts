
import { 
    VERIFY_CHANNEL
} from "../../settings";

import { 
    ModalInteractionContext,
    ComponentType,
    ButtonStyle
} from "slash-create";

import onMemberAccept from './member_accept';
import onMemberDecline from './member_decline';

export default async function onFormComplete(ctx: ModalInteractionContext) {
    if ('components' in ctx.data.data.components[0] && 'components' in ctx.data.data.components[1]) {
        await ctx.creator.requestHandler.request(
        "POST", 
        `/channels/${VERIFY_CHANNEL}/messages`,
        {
            auth: true,
            body: {
            embeds: [{
                title: "Verification Request",
                type: "rich",
                color: 2067276,
                timestamp: new Date(), 
                fields: [
                {
                    name: "Name",
                    value: ('value' in ctx.data.data.components[0].components[0]) ? ctx.data.data.components[0].components[0].value : "?",
                    inline: true
                },
                {
                    name: "Discord",
                    value: `<@${ctx.user.id}>`,
                    inline: true
                },
                {
                    name: "Student Email",
                    value: ('value' in ctx.data.data.components[1].components[0]) ? ctx.data.data.components[1].components[0].value : "?",
                    inline: false
                }]
            }],
            components: [
                {
                type: ComponentType.ACTION_ROW,
                components: [
                    {
                    custom_id: `member-reject-${ctx.user.id}`,
                    label: "Reject",
                    style: ButtonStyle.DANGER,
                    type: ComponentType.BUTTON
                },
                {
                    custom_id: `member-accept-${ctx.user.id}`,
                    label: "Accept",
                    style: ButtonStyle.SUCCESS,
                    type: ComponentType.BUTTON
                }]
                }]
            }});
        
        ctx.creator.registerGlobalComponent(`member-accept-${ctx.user.id}`, onMemberAccept);
        ctx.creator.registerGlobalComponent(`member-reject-${ctx.user.id}`, onMemberDecline);
        await ctx.send(`Thank you! Your request has been sent to the committee for moderation.\n-# You will recieve an update here once you've recieved your role!`)

    } else {
        await ctx.send({
            content: `An error occured whilst submitting the form. Please try again or contact a member of committee if this issue persists.`
        })
    }
}