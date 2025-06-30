export default {
  editor: {
    label: {
      en: 'Command',
      fr: 'Palette de Commandes'
    },
    icon: 'command'
  },
  triggerEvents: [
    {
      name: 'command-execute',
      label: { en: 'On command execute', fr: 'À l\'exécution de commande' },
      event: {
        item: {},
        group: {},
        groupIndex: 0,
        itemIndex: 0,
        searchTerm: ''
      }
    },
    {
      name: 'search',
      label: { en: 'On search', fr: 'À la recherche' },
      event: {
        term: '',
        results: []
      }
    },
    {
      name: 'close',
      label: { en: 'On close', fr: 'À la fermeture' },
      event: {}
    }
  ],
  properties: {
    variant: {
      label: { en: 'Variant', fr: 'Variante' },
      type: 'TextSelect',
      options: {
        options: [
          { value: 'default', label: { en: 'Default', fr: 'Par défaut' } },
          { value: 'dialog', label: { en: 'Dialog', fr: 'Dialogue' } }
        ]
      },
      defaultValue: 'default',
      bindable: true
    },
    placeholder: {
      label: { en: 'Search placeholder', fr: 'Placeholder de recherche' },
      type: 'Text',
      defaultValue: 'Type a command or search...',
      bindable: true
    },
    emptyMessage: {
      label: { en: 'Empty message', fr: 'Message vide' },
      type: 'Text',
      defaultValue: 'No results found.',
      bindable: true
    },
    closeOnBackdrop: {
      label: { en: 'Close on backdrop click', fr: 'Fermer au clic sur l\'arrière-plan' },
      type: 'OnOff',
      defaultValue: true,
      bindable: true
    },
    groups: {
      label: { en: 'Command groups', fr: 'Groupes de commandes' },
      type: 'Array',
      options: {
        item: {
          type: 'Object',
          options: {
            item: {
              id: {
                label: { en: 'ID', fr: 'ID' },
                type: 'Text',
                bindable: true
              },
              heading: {
                label: { en: 'Group heading', fr: 'Titre du groupe' },
                type: 'Text',
                bindable: true
              },
              items: {
                label: { en: 'Commands', fr: 'Commandes' },
                type: 'Array',
                options: {
                  item: {
                    type: 'Object',
                    options: {
                      item: {
                        id: {
                          label: { en: 'ID', fr: 'ID' },
                          type: 'Text',
                          bindable: true
                        },
                        label: {
                          label: { en: 'Label', fr: 'Libellé' },
                          type: 'Text',
                          bindable: true
                        },
                        icon: {
                          label: { en: 'Icon', fr: 'Icône' },
                          type: 'Icon',
                          bindable: true
                        },
                        shortcut: {
                          label: { en: 'Shortcut', fr: 'Raccourci' },
                          type: 'Text',
                          bindable: true
                        },
                        disabled: {
                          label: { en: 'Disabled', fr: 'Désactivé' },
                          type: 'OnOff',
                          defaultValue: false,
                          bindable: true
                        },
                        keywords: {
                          label: { en: 'Search keywords', fr: 'Mots-clés de recherche' },
                          type: 'Array',
                          options: {
                            item: {
                              type: 'Text'
                            }
                          },
                          bindable: true
                        }
                      }
                    }
                  }
                },
                bindable: true
              }
            }
          }
        }
      },
      defaultValue: [
        {
          id: 'suggestions',
          heading: 'Suggestions',
          items: [
            {
              id: 'calendar',
              label: 'Calendar',
              icon: 'calendar',
              shortcut: '⌘K C',
              keywords: ['date', 'schedule', 'event']
            },
            {
              id: 'emoji',
              label: 'Search Emoji',
              icon: 'smile',
              shortcut: '⌘K E',
              keywords: ['emoticon', 'smiley']
            }
          ]
        },
        {
          id: 'actions',
          heading: 'Actions',
          items: [
            {
              id: 'copy',
              label: 'Copy',
              icon: 'copy',
              shortcut: '⌘C',
              keywords: ['duplicate', 'clone']
            },
            {
              id: 'delete',
              label: 'Delete',
              icon: 'trash',
              shortcut: '⌘⌫',
              keywords: ['remove', 'trash']
            }
          ]
        }
      ],
      bindable: true
    },
    customClass: {
      label: { en: 'Custom CSS class', fr: 'Classe CSS personnalisée' },
      type: 'Text',
      bindable: true
    },
    customStyle: {
      label: { en: 'Custom style', fr: 'Style personnalisé' },
      type: 'Text',
      bindable: true
    }
  }
} 