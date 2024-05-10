import { CommonActions } from '@react-navigation/native';

export const resetNavigator = (navigation, routeName, props) => {
    navigation?.dispatch(
        CommonActions.reset({
            index: 0,
            routes: [{
                 name: routeName,
                 params: props
                }],
        })
    );
}