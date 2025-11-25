/**
 * BindX (bindX) Polymorphic Notation Test Fixtures
 *
 * Tests all 4 notation styles produce identical data binding:
 * 1. Verbose: bx-bind="username" bx-debounce="300" bx-throttle="100"
 * 2. Colon: bx-bind="username:300:100"
 * 3. JSON: bx-opts='{"bind":"username","debounce":300,"throttle":100}'
 * 4. CSS Class: class="bind-username-300-100"
 */

export const bindxSimpleBindingFixtures = {
    name: 'Simple one-way data binding',
    verbose: '<input bx-bind="username" />',
    colon: '<input bx-bind="username" />',
    json: '<input bx-opts=\'{"bind":"username"}\' />',
    cssClass: '<input class="bind-username" />',
    expectedBinding: { property: 'username', direction: 'two-way' },
    description: 'All notation styles should bind to username property'
};

export const bindxDebouncedBindingFixture = {
    name: 'Binding with debounce',
    verbose: '<input bx-bind="email" bx-debounce="500" />',
    colon: '<input bx-bind="email:500" />',
    json: '<input bx-opts=\'{"bind":"email","debounce":500}\' />',
    cssClass: '<input class="bind-email-500" />',
    expectedBinding: { property: 'email', debounce: 500 },
    expectedBehavior: 'Input changes should be debounced by 500ms',
    description: 'Debounced binding should delay updates'
};

export const bindxComplexBindingFixture = {
    name: 'Binding with debounce and throttle',
    verbose: '<input bx-bind="searchQuery" bx-debounce="300" bx-throttle="100" bx-mode="two-way" />',
    colon: '<input bx-bind="searchQuery:300:100:two-way" />',
    json: '<input bx-opts=\'{"bind":"searchQuery","debounce":300,"throttle":100,"mode":"two-way"}\' />',
    cssClass: '<input class="bind-searchQuery-300-100-two-way" />',
    expectedBinding: { property: 'searchQuery', debounce: 300, throttle: 100, mode: 'two-way' },
    expectedBehavior: 'Changes throttled at 100ms but debounced at 300ms',
    description: 'Complex binding with both debounce and throttle'
};

export const bindxEdgeCaseFixture = {
    name: 'Binding with empty property name',
    verbose: '<input bx-bind="" />',
    colon: '<input bx-bind="" />',
    json: '<input bx-opts=\'{"bind":""}\' />',
    cssClass: '<input class="bind-" />',
    expectedBinding: null,
    expectedBehavior: 'No binding should occur',
    description: 'Empty property name should not create binding'
};

export const bindxOneWayBindingFixtures = {
    name: 'One-way data binding (read-only)',
    verbose: '<span bx-bind="displayName" bx-mode="one-way">Default Name</span>',
    colon: '<span bx-bind="displayName:one-way">Default Name</span>',
    json: '<span bx-opts=\'{"bind":"displayName","mode":"one-way"}\'>Default Name</span>',
    cssClass: '<span class="bind-displayName-one-way">Default Name</span>',
    expectedBinding: { property: 'displayName', mode: 'one-way', readonly: true },
    expectedBehavior: 'Element updates from property but changes do not propagate back',
    description: 'One-way binding should only update element, not model'
};

export const bindxNestedPropertyFixtures = {
    name: 'Binding to nested property',
    verbose: '<input bx-bind="user.profile.email" bx-debounce="250" />',
    colon: '<input bx-bind="user.profile.email:250" />',
    json: '<input bx-opts=\'{"bind":"user.profile.email","debounce":250}\' />',
    cssClass: '<input class="bind-user.profile.email-250" />',
    expectedBinding: { property: 'user.profile.email', debounce: 250 },
    expectedPath: ['user', 'profile', 'email'],
    description: 'Nested paths should be resolved correctly'
};

export const bindxArrayIndexBindingFixture = {
    name: 'Binding to array element',
    verbose: '<input bx-bind="items[0].name" bx-debounce="200" />',
    colon: '<input bx-bind="items[0].name:200" />',
    json: '<input bx-opts=\'{"bind":"items[0].name","debounce":200}\' />',
    cssClass: '<input class="bind-items[0].name-200" />',
    expectedBinding: { property: 'items[0].name', debounce: 200 },
    expectedPath: ['items', 0, 'name'],
    description: 'Array indices should be parsed correctly'
};

export const bindxComputedPropertyFixtures = {
    name: 'Binding to computed property',
    verbose: '<span bx-bind="$computed:fullName" bx-mode="one-way">-</span>',
    colon: '<span bx-bind="$computed:fullName:one-way">-</span>',
    json: '<span bx-opts=\'{"bind":"$computed:fullName","mode":"one-way"}\'>-</span>',
    cssClass: '<span class="bind-$computed:fullName-one-way">-</span>',
    expectedBinding: { property: 'fullName', computed: true, readonly: true },
    expectedBehavior: 'Should only update when dependencies change',
    description: 'Computed properties should be recognized'
};

export const bindxEventBindingFixtures = {
    name: 'Event handler binding',
    verbose: '<button bx-click="handleSave" bx-debounce="500">Save</button>',
    colon: '<button bx-click="handleSave:500">Save</button>',
    json: '<button bx-opts=\'{"click":"handleSave","debounce":500}\'>Save</button>',
    cssClass: '<button class="bind-click-handleSave-500">Save</button>',
    expectedBinding: { event: 'click', handler: 'handleSave', debounce: 500 },
    expectedBehavior: 'Click handler should be debounced',
    description: 'Event binding with debounce'
};

export const bindxMultipleEventBindingFixture = {
    name: 'Multiple event handlers',
    verbose: '<input bx-change="onInputChange" bx-focus="onFocus" bx-blur="onBlur" />',
    colon: '<input bx-change="onInputChange" bx-focus="onFocus" bx-blur="onBlur" />',
    json: '<input bx-opts=\'{"change":"onInputChange","focus":"onFocus","blur":"onBlur"}\' />',
    cssClass: '<input class="bind-change-focus-blur-onInputChange-onFocus-onBlur" />',
    expectedBindings: [
        { event: 'change', handler: 'onInputChange' },
        { event: 'focus', handler: 'onFocus' },
        { event: 'blur', handler: 'onBlur' }
    ],
    description: 'Multiple event handlers should all be bound'
};

export const bindxConditionalBindingFixtures = {
    name: 'Conditional binding based on data',
    verbose: '<input bx-bind="email" bx-if="showEmailField" bx-debounce="300" />',
    colon: '<input bx-bind="email::300:showEmailField" />',
    json: '<input bx-opts=\'{"bind":"email","debounce":300,"if":"showEmailField"}\' />',
    cssClass: '<input class="bind-email-300-showEmailField" />',
    expectedBinding: { property: 'email', debounce: 300, condition: 'showEmailField' },
    expectedBehavior: 'Binding only active when showEmailField is true',
    description: 'Conditional binding should respond to condition changes'
};

export const bindxDefaultValueFixtures = {
    name: 'Binding with default value',
    verbose: '<input bx-bind="username" bx-default="Guest User" />',
    colon: '<input bx-bind="username::Guest User" />',
    json: '<input bx-opts=\'{"bind":"username","default":"Guest User"}\' />',
    cssClass: '<input class="bind-username--Guest-User" />',
    expectedBinding: { property: 'username', default: 'Guest User' },
    expectedInitialValue: 'Guest User',
    description: 'Default value should be used if property is undefined'
};

export const bindxTransformFixtures = {
    name: 'Binding with value transformer',
    verbose: '<span bx-bind="price" bx-transform="toCurrency">$0.00</span>',
    colon: '<span bx-bind="price::toCurrency">$0.00</span>',
    json: '<span bx-opts=\'{"bind":"price","transform":"toCurrency"}\'>$0.00</span>',
    cssClass: '<span class="bind-price--toCurrency">$0.00</span>',
    expectedBinding: { property: 'price', transformer: 'toCurrency' },
    expectedBehavior: 'Values should be transformed before display',
    description: 'Transformers should convert values for display'
};

export const bindxValidationFixtures = {
    name: 'Binding with validation rule',
    verbose: '<input bx-bind="email" bx-validate="isEmail" bx-error="Invalid email" />',
    colon: '<input bx-bind="email:isEmail:Invalid email" />',
    json: '<input bx-opts=\'{"bind":"email","validate":"isEmail","error":"Invalid email"}\' />',
    cssClass: '<input class="bind-email-isEmail-Invalid-email" />',
    expectedBinding: { property: 'email', validator: 'isEmail', errorMessage: 'Invalid email' },
    expectedBehavior: 'Values should be validated and error shown if invalid',
    description: 'Validation rules should be applied to binding'
};

export const bindxAsyncValidationFixture = {
    name: 'Async validation with error message',
    verbose: '<input bx-bind="username" bx-async-validate="checkUsernameAvailable" bx-error="Username taken" />',
    colon: '<input bx-bind="username:checkUsernameAvailable:Username taken" />',
    json: '<input bx-opts=\'{"bind":"username","async_validate":"checkUsernameAvailable","error":"Username taken"}\' />',
    cssClass: '<input class="bind-username-checkUsernameAvailable-Username-taken" />',
    expectedBinding: { property: 'username', asyncValidator: 'checkUsernameAvailable', errorMessage: 'Username taken' },
    expectedBehavior: 'Async validator should be called and error shown if validation fails',
    description: 'Async validation for availability checks'
};

export const bindxWatcherFixtures = {
    name: 'Property watcher with callback',
    verbose: '<div bx-watch="selectedItem" bx-on-change="handleItemSelected">Item: -</div>',
    colon: '<div bx-watch="selectedItem:handleItemSelected">Item: -</div>',
    json: '<div bx-opts=\'{"watch":"selectedItem","on_change":"handleItemSelected"}\'>Item: -</div>',
    cssClass: '<div class="bind-watch-selectedItem-handleItemSelected">Item: -</div>',
    expectedWatcher: { property: 'selectedItem', onChange: 'handleItemSelected' },
    expectedBehavior: 'handleItemSelected callback should be called when selectedItem changes',
    description: 'Watchers should trigger callbacks on property change'
};

export const bindxDeepWatchFixture = {
    name: 'Deep object watcher',
    verbose: '<div bx-watch="user.*" bx-deep="true" bx-on-change="onUserChanged">User Profile</div>',
    colon: '<div bx-watch="user.*:true:onUserChanged">User Profile</div>',
    json: '<div bx-opts=\'{"watch":"user.*","deep":true,"on_change":"onUserChanged"}\'>User Profile</div>',
    cssClass: '<div class="bind-watch-user.*-true-onUserChanged">User Profile</div>',
    expectedWatcher: { property: 'user.*', deep: true, onChange: 'onUserChanged' },
    expectedBehavior: 'Should detect nested changes in user object',
    description: 'Deep watchers should detect nested property changes'
};

export const bindxFormBindingFixtures = {
    name: 'Form-wide binding',
    verbose: '<form bx-bind="userData" bx-debounce="500"><input name="email" /></form>',
    colon: '<form bx-bind="userData:500"><input name="email" /></form>',
    json: '<form bx-opts=\'{"bind":"userData","debounce":500}\'><input name="email" /></form>',
    cssClass: '<form class="bind-userData-500"><input name="email" /></form>',
    expectedBinding: { object: 'userData', debounce: 500, scope: 'form' },
    expectedBehavior: 'Form fields should bind to userData properties by name',
    description: 'Form-wide binding should map fields to object properties'
};

/**
 * Test page with all bindX notation styles
 */
export function createBindXTestPage(bindingType = 'simple') {
    const fixtures = {
        simple: bindxSimpleBindingFixtures,
        debounced: bindxDebouncedBindingFixture,
        complex: bindxComplexBindingFixture,
        oneWay: bindxOneWayBindingFixtures,
        nested: bindxNestedPropertyFixtures,
        computed: bindxComputedPropertyFixtures,
        event: bindxEventBindingFixtures,
        validation: bindxValidationFixtures,
        watcher: bindxWatcherFixtures,
        form: bindxFormBindingFixtures
    };

    const fixture = fixtures[bindingType] || fixtures.simple;

    return `
        <div data-test="bindx-polymorphic-notation">
            <section data-notation="verbose">
                <h3>Verbose Notation</h3>
                ${fixture.verbose}
            </section>
            <section data-notation="colon">
                <h3>Colon Notation</h3>
                ${fixture.colon}
            </section>
            <section data-notation="json">
                <h3>JSON Notation</h3>
                ${fixture.json}
            </section>
            <section data-notation="class">
                <h3>CSS Class Notation</h3>
                ${fixture.cssClass}
            </section>
        </div>
    `;
}

/**
 * Performance test: All notation styles with 1000 elements
 */
export function createBindXPerformanceTest(count = 1000) {
    const templates = [
        '<input bx-bind="value" bx-debounce="300" />',
        '<input bx-bind="value:300" />',
        '<input bx-opts=\'{"bind":"value","debounce":300}\' />',
        '<input class="bind-value-300" />'
    ];

    const elements = [];
    for (let i = 0; i < count; i++) {
        const template = templates[i % templates.length];
        const fieldName = `field${i}`;
        elements.push(template.replace('value', fieldName));
    }

    return `
        <form data-test="bindx-performance" data-count="${count}">
            ${elements.join('\n')}
        </form>
    `;
}

/**
 * Priority resolution test
 */
export const bindxPriorityTestFixture = {
    name: 'Priority resolution - JSON > Colon > Verbose > Class',
    description: 'JSON should take priority over other notations',
    element: '<input bx-bind="verbose" bx-opts=\'{"bind":"json"}\' class="bind-class" />',
    expectedProperty: 'json',
    reason: 'bx-opts (JSON) takes priority'
};

export default {
    bindxSimpleBindingFixtures,
    bindxDebouncedBindingFixture,
    bindxComplexBindingFixture,
    bindxEdgeCaseFixture,
    bindxOneWayBindingFixtures,
    bindxNestedPropertyFixtures,
    bindxArrayIndexBindingFixture,
    bindxComputedPropertyFixtures,
    bindxEventBindingFixtures,
    bindxMultipleEventBindingFixture,
    bindxConditionalBindingFixtures,
    bindxDefaultValueFixtures,
    bindxTransformFixtures,
    bindxValidationFixtures,
    bindxAsyncValidationFixture,
    bindxWatcherFixtures,
    bindxDeepWatchFixture,
    bindxFormBindingFixtures,
    createBindXTestPage,
    createBindXPerformanceTest,
    bindxPriorityTestFixture
};
