declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      login(): void;
      logToConsole(message: string, optional?: any): void;
      text(): Chainable<string>;
      checkAccessibility(subject: any, axeOptions?: any, skip?: boolean): void;
    }
  }
}
// Disabling tslint rule since cypress-cucumber has
// issues with absolute import paths.
// This can be removed when
// https://github.com/cypress-io/cypress-browserify-preprocessor/issues/53
// is fixed.
/* tslint:disable*/
import { CdHelperClass } from '../../src/app/shared/classes/cd-helper.class';
import { Permissions } from '../../src/app/shared/models/permissions';
import { table } from 'table';
/* tslint:enable*/
let auth: any;

const fillAuth = () => {
  window.localStorage.setItem('dashboard_username', auth.username);
  window.localStorage.setItem('dashboard_permissions', auth.permissions);
  window.localStorage.setItem('user_pwd_expiration_date', auth.pwdExpirationDate);
  window.localStorage.setItem('user_pwd_update_required', auth.pwdUpdateRequired);
  window.localStorage.setItem('sso', auth.sso);
};

Cypress.Commands.add('login', () => {
  const username = Cypress.env('LOGIN_USER') || 'admin';
  const password = Cypress.env('LOGIN_PWD') || 'admin';

  cy.session([username, password], () => {
    if (auth === undefined) {
      cy.request({
        method: 'POST',
        url: 'api/auth',
        headers: { Accept: CdHelperClass.cdVersionHeader('1', '0') },
        body: { username: username, password: password }
      }).then((resp) => {
        auth = resp.body;
        auth.permissions = JSON.stringify(new Permissions(auth.permissions));
        auth.pwdExpirationDate = String(auth.pwdExpirationDate);
        auth.pwdUpdateRequired = String(auth.pwdUpdateRequired);
        auth.sso = String(auth.sso);
        fillAuth();
      });
    } else {
      fillAuth();
    }
  });
});

// @ts-ignore
Cypress.Commands.add('text', { prevSubject: true }, (subject: any) => {
  return subject.text();
});

Cypress.Commands.add('logToConsole', (message: string, optional?: any) => {
  cy.task('log', { message: `(${new Date().toISOString()}) ${message}`, optional });
});

// Print cypress-axe violations to the terminal
function a11yErrorLogger(violations: any) {
  const violationData = violations.flatMap(({ id, impact, description, nodes }: any) => {
    return nodes.flatMap(({ html }: any) => {
      return [
        ['Test', Cypress.currentTest.title],
        ['Error', id],
        ['Impact', impact],
        ['Description', description],
        ['Element', html],
        ['', '']
      ];
    });
  });

  cy.task('log', {
    message: table(violationData, {
      header: {
        alignment: 'left',
        content: Cypress.spec.relative
      }
    })
  });
}

Cypress.Commands.add('checkAccessibility', (subject: any, axeOptions?: any, skip?: boolean) => {
  cy.checkA11y(subject, axeOptions, a11yErrorLogger, skip);
});
