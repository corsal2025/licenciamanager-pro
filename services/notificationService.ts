
export interface NotificationTemplate {
    id: string;
    name: string;
    content: string; // Uses {name} as placeholder
}

export const notificationService = {
    templates: [
        {
            id: 'ready_pickup',
            name: 'Licencia Lista para Retiro',
            content: 'Hola {name}, su licencia de conducir ya se encuentra disponible para retiro. Puede acercarse a nuestras oficinas en horario de atención.'
        },
        {
            id: 'docs_missing',
            name: 'Documentación Pendiente',
            content: 'Hola {name}, le informamos que su trámite de licencia se encuentra detenido por falta de documentación. Por favor acérquese a regularizar su situación.'
        },
        {
            id: 'medical_exam',
            name: 'Examen Médico',
            content: 'Hola {name}, le recordamos su cita para el examen médico psicotécnico. Por favor llegar 15 minutos antes.'
        },
        {
            id: 'generic',
            name: 'Mensaje General',
            content: 'Hola {name}, le escribimos del Departamento de Tránsito respecto a su licencia: '
        }
    ] as NotificationTemplate[],

    getTemplates: () => {
        return notificationService.templates;
    },

    formatMessage: (templateId: string, userName: string): string => {
        const template = notificationService.templates.find(t => t.id === templateId);
        if (!template) return '';
        return template.content.replace('{name}', userName);
    },

    generateWhatsAppUrl: (phone: string, message: string): string => {
        let cleanPhone = phone.replace(/\D/g, '');
        // Simple naive Chile logic: if 9 chars start with 9, add 56.
        if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
            cleanPhone = '56' + cleanPhone;
        }
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    }
};
