## 表单

antd pro 里的 ProForm 表单组件其实就是封装好了 ProForm.Item 和 表单组件。

### 自定义封装表单组件

> **注意：**`ProForm.useForm()`和`Form.useForm()`获得的 form 实例是不一样的。如果给 ProForm 传入的是 `Form.useForm` 创建的 form 实例，子组件里使用 getFieldValue 和 setFieldsValue 可能无法获取和更新表单域的值。

类似上传单张图片的 Upload 组件，没有提供相应的 ProForm 组件，而且我们还需要获取到表单里的值填入到 Upload 里面的 img 里去，上传完成后 form 也可以获取到 Upload 里的图片链接。而且 Upload 展示的图片还需要在表单重置后也一起清除，在表单 setFieldsValue 的时候填入对应的图片地址。

ProForm.Item 的 children 会被注入 FormInstance ，我们可以通过注入的 FormInstance 获取和设置 field 的值，但是注意这个时候 Form.Item 不能和 name 共存， 而且使用 children 注入 FormInstance  的时候需要给 ProForm.Item 设置 shouldUpdate（这种情况下，Form 如果使用 ProForm.useForm() 传入 props 的 form实例，提交的时候会获取不到 upload 的 field 值）。form 的 `initialValues` 不能被 `setState` 动态更新，只能用 `setFieldsValue` 来更新。

```tsx
   <ProForm.Item
      label={label}
      required={required}
      trigger='onChange'
      shouldUpdate
    >
      {
        ({ getFieldValue, setFieldsValue }) => {
          const handleChange = (info: UploadChangeParam<UploadFile<any>>) => {
            if (info.file.status === 'uploading') {
              setImgLoading(true)
              return;
            } else if (info.file.status === 'done' && typeof name === 'string') {
              setFieldsValue({
                [name]: info.file.response.data
              })
            }
            setImgLoading(false)
          }
          return (
            <Upload
              listType="picture-card"
              showUploadList={false}
              onChange={handleChange}
              action=''
              headers={{
                Authorization: 'Bearer ' + getToken()
              }}
              style={{
                width,
                height
              }}
            >
            {
              (name && getFieldValue(name)) ? (
                <img
                  style={{
                    width: '100%',
                    height: '100%'
                  }}
                  src={getFieldValue(name)}
                />
              ): (
                <div style={{ marginTop: 8 }}>
                  {imgLoading ? <LoadingOutlined /> : <PlusOutlined />}
                </div>
              )
            }
      </Upload>

          )
        }
      }
    </ProForm.Item>
```

上述写法假如`<ProForm form={form}>`，组件里执行`setFieldsValue` 是不会被表单域捕捉到修改的，虽然`getFieldValue`能正确获取到。

```tsx
(
    <ProForm.Item
      noStyle
      shouldUpdate
    >
      {
        ({ getFieldValue }) => {
          const handleChange = (info: UploadChangeParam<UploadFile<any>>) => {
            if (info.file.status === 'uploading') {
              setImgLoading(true)
            } else if (info.file.status === 'done') {
              setImgLoading(false)
            }
          }
          
          const imgUrl =  (formProps && formProps.name) && getFieldValue(formProps.name)
          
          return (
            <ProForm.Item
              {...formProps}
              getValueFromEvent={(info) => {
                if (info.file.status === 'done') {
                  return info.file.response.data
                }
              }}
            >
              <Upload
                accept='image/*'
                listType="picture-card"
                showUploadList={false}
                onChange={handleChange}
                action=''
                headers={{
                  Authorization: 'Bearer ' + getToken()
                }}
                style={{
                  width,
                  height
                }}
              >
              {
                imgUrl ? (
                  <img
                    style={{
                      width: '100%',
                      height: '100%'
                    }}
                    src={imgUrl}
                  />
                ): (
                  <div style={{ marginTop: 8 }}>
                    {imgLoading ? <LoadingOutlined /> : <PlusOutlined />}
                  </div>
                )
              }
            </Upload>

            </ProForm.Item>
          )
        }
      }
    </ProForm.Item>
  )
```

再包裹一层 Form.Item 就能达到我们想要的效果了，

### ProFormSelect

下拉选择器的 value 只能是 `string|number|undefined`。这样的话只能实现获取到当前选中的列表项的 ID ，无法获取到选择列表项的其他属性，需要在获取的时候我们自己保存。

### Form.Item 的 name

name 如果是字符串数组的话，表示的是嵌套的对象属性。

而 ProFormDependency 的 name 参数必须要是一个数组（这里的 name 完全不一样，准确来说是依赖数组），如果是嵌套的结构可以这样配置 `name={['name', ['name2', 'text']]}`。配置的 name 的值会在 renderProps 中传入。`name={['name', ['name2', 'text']]}` 传入的 values 的值 为 `{ name: string, name2: { text:string } }`。但是例如 `[['name', 'text1'], ['name', 'text2']]`这样的写法，`name.text1`会获取不到，如果想获取到 text1 和 text2 ，直接传 `name`。

### transform

ProForm 组件的 transform props 可以在提交的时候格式化为想要的数据。

## Table

table 的 render 可以返回一个数组，渲染的时候会自动调整数组元素的间距。但是这个时候，你需要给这些数组里返回的ReactComponent 提供一个key，否则会一直控制台报错。

## 升级V5

> [文档](https://beta-pro.ant.design/docs/upgrade-v5-cn#initialstate)

## V3版本开发

- V3版本的 antd 的 form 获取实例，在 class 组件里目前我只能通过给组件包装 `Form.create({})(Component)` 然后从 props 里获取到。而且假如页面里有多个form，比如 modal 里有表单的话，我们只能把modal里的表单包装成组件然后同样使用 `Form.create` 包裹在组件内部。

  ```jsx
  Form.create({})(ModalComponent);
  
  <ModalComponent wrappedComponentRef={(form) => this.modalForm = form}></ModalComponent>
  ```

  然后我们就可以通过 `this.modalForm.props.form` 获取到组件实例。

- V3 的 Upload 单图上传和 form ，目前只能把图放到 state 里面去控制展示。如果使用了 `getFieldDecorator` 的话，表单会和 Upload 双向绑定，而 Upload 没有value会导致报错。假如设置成 fileList（字符串数组）的话，和我们的单图（字符串）会因为类型不同产生bug。虽然我们可以通过在 form 获取值的方法里面把单图转换单个字符串的数组。V3 版本提供了 `validateStatus` `help` `hasFeedback` 等属性，可以不需要使用 `Form.create` 和 `getFieldDecorator`，自己定义校验的时机和内容。

- 在后台配置实现一个类似手机模拟器的效果，模拟器高度需要我们计算出内容区域高度，然后根据16：9计算出宽度，页面 100vh 这样就能保证无论页面只有模拟器内有滚动条。模拟器内部我们使用 sticky 布局可以实现吸底的按钮栏。

- 3.x以上版本使用 Upload 组件报错：`Unknown props `directory`, `webkitdirectory` on <input> tag`，官方解答：`Please upgrade to react 16`。

- less 中，由于 less 的计算方式跟 calc 方法有重叠，两者在一起有冲突。我们写的 calc 里的算式会被 less 计算掉，所以我们需要使用 `div {width : calc(~"100% - 30px");}` 这样的写法。

