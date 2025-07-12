
import { 
    ComponentContext,
    ComponentType,
    TextInputStyle
} from 'slash-create';

export default async function onPrivacyAccept(ctx: ComponentContext) {
    await ctx.sendModal(
      {
        title: 'Get Your Member Role',
        custom_id: 'verify-form',
        components: [
          {
            type: ComponentType.ACTION_ROW,
            components: [
              {
                type: ComponentType.TEXT_INPUT,
                label: 'Full Name',
                style: TextInputStyle.SHORT,
                custom_id: 'name',
                placeholder: 'Enter your full name as on your guild account...'
              }
            ]
          },
          {
            type: ComponentType.ACTION_ROW,
            components: [
              {
                type: ComponentType.TEXT_INPUT,
                label: 'Student Email',
                style: TextInputStyle.SHORT,
                custom_id: 'email',
                placeholder: 'Enter your student email...'
              }
            ]
          },
        ]
      }
    );
  }